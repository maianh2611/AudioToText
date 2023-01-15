/**
 * Module dependencies.
 */
require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const multer = require('multer');
const { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } = require("@aws-sdk/client-transcribe");
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const cors = require('cors');

// Middleware to parse request
const upload = multer({ dest: "uploads/" });
const client = new MongoClient(process.env['MONGODB_URL']);
const app = express();
// Create an Amazon S3 service client object.
const s3Client = new S3Client({ region: process.env['REGION'] });
// Create an Amazon Transcribe service client object.
const transcribeClient = new TranscribeClient({ region: process.env['REGION'] });
const db = client.db('AudioToText');
const collection = db.collection('tasks');


var corsOptions = {
  origin: 'http://localhost:3000',
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions));
app.use(express.json());

async function sendFileToTranscriber(taskID) {
  const params = {
    TranscriptionJobName: taskID,
    LanguageCode: process.env['LANGUAGE_CODE'], // For example, 'en-US'
    //MediaFormat: fileType, // For example, 'wav'
    Media: {
      MediaFileUri: process.env['SOURCE_LOCATION'] + taskID,
    },
    OutputBucketName: process.env['BUCKET_NAME']
  };
  try {
    const data = await transcribeClient.send(
      new StartTranscriptionJobCommand(params)
    );
    //console.log("Success - put", data);
    return true;
  } catch (err) {
    console.log("Error", err);
    return false;
  }
}
async function deleteFileOnS3Bucket(taskID) {
  const params = {
    Bucket: process.env['BUCKET_NAME'],
    Key: taskID,
  }
  try {
    // Delete the object.
    await s3Client.send(
      new DeleteObjectCommand(params)
    );
    return true;
  } catch (err) {
    console.log("Error deleting object", err);
    return false;
  }
}
async function getFileFromS3Bucket(taskID) {
  const params = {
    Bucket: process.env['BUCKET_NAME'],
    Key: taskID + ".json",
  };
  try {
    // Get the object} from the Amazon S3 bucket. It is returned as a ReadableStream.
    const data = await s3Client.send(new GetObjectCommand(params));
    // Convert the ReadableStream to a string.
    const fileString = await data.Body.transformToString();
    return fileString;
  } catch (err) {
    console.log("Error", err);
  }
}

async function updateFileInDatabase(taskID, transcript) {
  try {
    await collection.updateOne(
      {_id: taskID},
      { $set: { transcript : transcript } }
    );
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}
async function getTaskFromDatabase(taskID) {
  const task = await collection.find({ _id: taskID }).toArray(); // since collection.find returns a Cursor which is A pointer to the result set of a query.
  return task[0];
}

async function checkJobStatus(req, res) {
  const taskID = req.params.taskId;
  const task = await getTaskFromDatabase(taskID);
  if (task === undefined) {
    res.status(400).send("Task " + taskID + " Not Found");
    return;
  }
  const params = {
    TranscriptionJobName: taskID,
  }
  const command = new GetTranscriptionJobCommand(params);
  try {
    const data = await transcribeClient.send(
      command
    );
    const status = data.TranscriptionJob.TranscriptionJobStatus;
    let transcript = undefined;
    if (status === "COMPLETED") {
      const file = await getFileFromS3Bucket(taskID);
      transcript = JSON.parse(file).results.transcripts[0].transcript;
      
      if (!(await updateFileInDatabase(taskID, transcript))) {
        res.status(500).send("Something went wrong when store the file transcript into database");
        return;
      }
      // Clean up S3 bucket
      
      if (!(await deleteFileOnS3Bucket(taskID+".json"))) {
        res.status(500).send("Something went wrong when delete file from the S3 bucket");
        return;
      }

      if (!(await deleteFileOnS3Bucket(taskID))) {
        res.status(500).send("Something went wrong when delete file from the S3 bucket");
        return;
      }
    }
    res.status(200).send({ status: status });
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
} 

async function insertFileToDatabase(fileName, taskID) {
  try {
    await collection.insertOne({
      _id: taskID,
      name: fileName,
    });
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

async function uploadFileToS3Bucket(filePath, taskID) {
  console.log(filePath);
  const fileContent = fs.readFileSync(filePath);
  const bucketParams = {
    Bucket: process.env['BUCKET_NAME'],
    Key: taskID, //fileName
    Body: fileContent,
  };
  try {
    const data = await s3Client.send(new PutObjectCommand(bucketParams));
    return true;
  } catch (err) {
    console.log(err);
    return false;
  } finally {
    //Delete file on the directory uploads/
    fs.unlink(filePath, (err) => {
      if (err) {
        throw err;
      }
      console.log("File is deleted");
    });
  }
}

async function processUploadedFile(req, res) {
  const file = req.file;
  if (!file) {
    res.status(400).send("File not found" );
    return;
  }
  console.log(file);
  if ((file.mimetype).startsWith('audio/') || (file.mimetype).startsWith('video/')) {
    const taskID = uuidv4();

    if (!(await insertFileToDatabase(file.originalname, taskID))) {
      res.status(409).send("Something wrong when insert files to database");
      return;
    }
  
    //Upload To S3
    if (!(await uploadFileToS3Bucket(file.path, taskID))) {
      res.status(500).send("Something wrong when upload files to AWS S3");
      return;
    }
  
    if (!(await sendFileToTranscriber(taskID))) {
      res.status(500).send("Something wrong when send files to AWS transcriber");
      return;
    }
  
    res.send({ taskID });
    return;
  }
  res.status(409).send("The data in your input media file isn't valid. Check the media file and try your request again.");
  return;
}


app.post('/tasks', upload.single("file"), processUploadedFile);

app.get('/tasks/:taskId', checkJobStatus);

app.get('/tasks/:taskId/transcript', async (req, res) => {
  const task = await getTaskFromDatabase(req.params.taskId);
  if (task === undefined) {
    res.status(400).send("Task Not Found");
    return;
  }
  let transcript = task.transcript;
  const fileData = transcript;
  const fileName = task.name.substring(0, task.name.indexOf('.')) +".txt";
  const fileType = 'text/plain';
  res.writeHead(200, {
    'Content-Disposition': 'attachment; filename=' + fileName,
    'Content-Type': fileType,
  })

  const download = Buffer.from(fileData)
  res.end(download)
});

app.use(express.static('build'));

async function main() {
  await client.connect();
  app.listen(parseInt(process.env['PORT']), () => {
    console.log(`Server started on port ${process.env['PORT']}`);
  });
}


main();
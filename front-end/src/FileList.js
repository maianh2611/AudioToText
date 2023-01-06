import Nav from 'react-bootstrap/Nav';
import { Table } from 'react-bootstrap';
import React from 'react';

class FileList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            completedFiles : [],
            processingFiles : [],
            errorFiles: []
        }
    }
    checkFileStatus(file) {
        let temp = Math.random();
        if (temp <= 0.4) {
            file.status = "test.com/" + file.taskID;
        } else if (temp > 0.4 && temp <= 0.6) {
            file.status = "Error";
        } else {
            file.status = "Transcribing";
        }
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(file)
            }, 500);
        });
    }

    updateState(completedFiles, newErrorFiles) {
        console.log("updateState");
        if (completedFiles.length === 0) {
            return;
        }
        let newprocessingFileList = this.state.processingFiles.slice();
        newprocessingFileList = newprocessingFileList.filter(file => !completedFiles.find(f => file.taskID === f.taskID));
        newprocessingFileList = newprocessingFileList.filter(file => !newErrorFiles.find(f => file.taskID === f.taskID));
        const newCompletedFileList = this.state.completedFiles.slice();
        completedFiles.forEach(file => newCompletedFileList.push(file));
        const newErrorFileList = this.state.errorFiles.slice();
        newErrorFiles.forEach(file => newErrorFileList.push(file));
        this.setState({completedFiles: newCompletedFileList, processingFiles: newprocessingFileList, errorFiles: newErrorFileList}, () => localStorage.setItem("state", JSON.stringify(this.state)));
        //console.log(completedFiles);
    }

    updateFileStatus() {
        if (this.state.processingFiles.length === 0) {
            return;
        }
        // Stop interval
        clearInterval(this.timerID);
        var promises = [];
        let newCompletedFiles = [];
        let newErrorFiles = [];
        this.state.processingFiles.forEach((file) => {
            promises.push(this.checkFileStatus(file)
            .then(() => {
                if (file.status === "test.com/" + file.taskID) {
                    newCompletedFiles.push(file);
                } else if (file.status === "Error") {
                    newErrorFiles.push(file);
                }
            }));
        })
        // Wait until all promises returns, then update the state and restart the interval
        Promise.all(promises).then(() => this.updateState(newCompletedFiles, newErrorFiles)).then(() => this.timerID = (setInterval(() => this.updateFileStatus(), 2000))); 
        
        /*for (let i = 0; i < this.state.processingFiles.length; i++) {
            const currentProcess = this.state.processingFiles[i];
            this.checkFileStatus(currentProcess.taskID).then((status) => {
                this.getNewCompletedFile(status);   
            });
        }*
        /*.then((completedFiles) => {
            this.updateState(completedFiles)
        });*/
    }

    componentDidMount() {
        this.timerID = setInterval(() => this.updateFileStatus(), 2000);
        const previousState = localStorage.getItem("state");
        if (previousState !== "") {
            this.setState(JSON.parse(previousState))
        } 
        //
        console.log(localStorage.getItem("state"));
    }
    componentWillUnmount() {
        clearInterval(this.timerID);
    }
    
    
    addProcessingFiles(fileName, taskID) {
        const newProcessingFiles = this.state.processingFiles.slice();
        newProcessingFiles.push({name: fileName, taskID: taskID, status: "Transcribing"});
        this.setState({processingFiles: newProcessingFiles},() => localStorage.setItem("state", JSON.stringify(this.state)));
    }        



    render() {
        const completedFiles = this.state.completedFiles;
        const completeFilesList = completedFiles.map((completedFile) =>
            <tr key={completedFile.taskID.toString()}>
                <td>
                    <Nav.Item>
                        <Nav.Link href={completedFile.status} download>{completedFile.name}</Nav.Link>
                    </Nav.Item>    
                </td>
                <td>Completed</td>
            </tr>
        );
        const processingFiles = this.state.processingFiles;
        const processingFilesList = processingFiles.map((processingFile) =>
            <tr key={processingFile.taskID.toString()}>
                <td>{processingFile.name}</td>
                <td>{processingFile.status}</td>
            </tr>
        );
        const errorFiles = this.state.errorFiles;
        const errorFilesList = errorFiles.map((errorFile) =>
            <tr key={errorFile.taskID.toString()}>
                <td>{errorFile.name}</td>
                <td>{errorFile.status}</td>
            </tr>
        );
        return (
            <div>
                <h2>mai anh an cut</h2>
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>File Name</th>
                            <th>Transcribing Progress</th>
                        </tr>
                    </thead>
                    <tbody>
                        {completeFilesList}
                        {errorFilesList}
                        {processingFilesList}
                    </tbody>
                </Table>
            </div>
        );
    }
}

export default FileList;


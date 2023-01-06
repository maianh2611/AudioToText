import React from 'react';
import FileForm from './FileForm';
import FileList from './FileList';
import './App.css';

class App extends React.Component {

  constructor(props) {
    super(props);
    this.fileList = React.createRef();
    this.fileForm = React.createRef();
  }
  /* Promise<TaskID> */ uploadFile(file, callback) {
        // return fetch('dummyUrl', {
        //     method: 'POST',
        //     body: file,
        // }).then((response) => {
        //     return response.body.taskID;
        // });

        return new Promise((resolve) => {
          setTimeout(() => {
              resolve(Math.floor(Math.random() * 99999999))
          }, 500);
      });
  }

  handleSubmit(event) {
      event.preventDefault();
      const file = event.target.file.files[0];
      if (file === undefined) {
        return;
      }
      this.uploadFile(file).then((taskId) => {
          this.fileList.current.addProcessingFiles(file.name, taskId);
      });
      event.target.reset();
      // let req = new XMLHttpRequest();
      // req.open("POST", '/upload/image');
      // req.send(file);
  }

  render() {
    return (
      <div className="App">
        <FileForm ref={this.fileForm} handleSubmit={(event)=> {this.handleSubmit(event)}}/>
        <FileList ref={this.fileList}/>
      </div>
    );
  }
}
export default App;

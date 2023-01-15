import React from 'react';
import FileForm from './FileForm';
import FileList from './FileList';
import './App.css';
import BackGround1 from './pic2.svg';
import BackGround2 from './pic1.svg';
import { ROOT_PATH } from './Constants';

class App extends React.Component {

  constructor(props) {
    super(props);
    this.fileList = React.createRef();
    this.fileForm = React.createRef();
  }
  uploadFile(file) {
    let formData = new FormData();
    formData.append('file', file);
    const request = {
      method: 'POST',
      body: formData
    };
    return fetch(`${ROOT_PATH}/tasks`, request);
  }

  getExtension(filename) {
    return filename.split('.').pop()
  }

  handleSubmit(event) {
      event.preventDefault();
      const file = event.target.file.files[0];
      if (file === undefined) {
        this.fileForm.current.setState({errorMessage : 'Your input is empty'});
        return;
      }
      this.fileForm.current.setState({errorMessage : ''});
      this.uploadFile(file).then((res) => {
        if(res.ok) {
          return res.json();
        }
        return res.text().then(text => { throw text })
      }).then((data)=> {this.fileList.current.addProcessingFiles(file.name, data.taskID);})
      .catch((error) => {
        this.fileForm.current.setState({errorMessage : error});
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
        <br/>
        <img className="background1" src={BackGround1} alt="symbol"></img>
        <img className="background2" src={BackGround2} alt="symbol"></img>
        <FileList ref={this.fileList}/>
      </div>
    );
  }
}
export default App;

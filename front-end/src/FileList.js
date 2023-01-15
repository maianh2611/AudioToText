import React from 'react';
import './FileList.css';
import Button from 'react-bootstrap/esm/Button';
import Spinner from 'react-bootstrap/Spinner';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Table } from 'react-bootstrap';
import { ROOT_PATH } from './Constants';

class FileList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            completedFiles : [],
            processingFiles : [],
            errorFiles: [],
        }
    }
    checkFileStatus(taskID) {
        const url = `${ROOT_PATH}/tasks/${taskID}`; 
        return fetch(url)
    }

    updateState(completedFiles, newErrorFiles) {
        console.log("updateState");
        if (completedFiles.length === 0 && newErrorFiles.length === 0) {
            return;
        }
        let newprocessingFileList = this.state.processingFiles.slice();
        newprocessingFileList = newprocessingFileList.filter(file => !completedFiles.find(f => file.taskID === f.taskID));
        newprocessingFileList = newprocessingFileList.filter(file => !newErrorFiles.find(f => file.taskID === f.taskID));
        let newCompletedFileList = this.state.completedFiles.slice();
        completedFiles.forEach(file => newCompletedFileList.push(file));
        let newErrorFileList = this.state.errorFiles.slice();
        newErrorFiles.forEach(file => newErrorFileList.push(file));
        
        this.setState({completedFiles: newCompletedFileList, processingFiles: newprocessingFileList, errorFiles: newErrorFileList}, () => {console.log(this.state.processingFiles);localStorage.setItem("state", JSON.stringify(this.state))});
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
            promises.push(this.checkFileStatus(file.taskID)
            .then((res) => {return res.json();}).then((data) =>{file.status = data.status}).then(()=>{
                if (file.status === "COMPLETED") {
                    newCompletedFiles.push(file);
                } else if (file.status === "FAILED") {
                    newErrorFiles.push(file);
                }
            }));
        })
        // Wait until all promises returns, then update the state and restart the interval
        Promise.all(promises).then(() => this.updateState(newCompletedFiles, newErrorFiles)).then(() => this.timerID = (setInterval(() => this.updateFileStatus(), 2000))); 
    }

    resetTable(){
        localStorage.clear();
        this.setState({completedFiles : [], processingFiles : [], errorFiles: []});
    }

    componentDidMount() {
        this.timerID = setInterval(() => this.updateFileStatus(), 10000);
        const previousState = localStorage.getItem("state");
        if (previousState !== "") {
            this.setState(JSON.parse(previousState))
        } 
    }

    componentWillUnmount() {
        clearInterval(this.timerID);
    }
    
    
    addProcessingFiles(fileName, taskID) {
        const newProcessingFiles = this.state.processingFiles.slice();
        const created = new Date().toLocaleString() + "";
        newProcessingFiles.push({name: fileName, taskID: taskID, status: "In progress", uploadedTime: created});
        this.setState({processingFiles: newProcessingFiles}, () => localStorage.setItem("state", JSON.stringify(this.state)));
    }        

    render() {
        const totalFiles = this.state.completedFiles.concat(this.state.errorFiles, this.state.processingFiles);
        totalFiles.sort(function(a,b){
            return new Date(b.uploadedTime) - new Date(a.uploadedTime);
        });
        const totalFileList = totalFiles.map((file) =>
        <tr key={file.taskID.toString()}>
            <td>{
                // If file is completed, display with a hyperlink, otherwise just display the filename
                    /*if*/(file.status === 'COMPLETED') ? 
                        <a className="text-primary" href={`${ROOT_PATH}/tasks/${file.taskID}/transcript`}>{file.name}</a> :
                    /*else*/ 
                        file.name
                }       
            </td>
            {
                /*if*/(file.status === 'COMPLETED') ? 
                    <td className="text-success"><i className="bi bi-check"></i>{file.status.charAt(0)+ file.status.slice(1).toLowerCase()}</td> :
                /*else*/
                    (
                    /*if*/(file.status === 'FAILED') ? 
                        <td className="text-danger"><i className="bi bi-x"></i>{file.status.charAt(0)+ file.status.slice(1).toLowerCase()}</td> :
                    /*else*/ 
                        <td className="text-primary">
                        <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        />
                        In progress
                        </td>
                    )
            }
            <td>{file.uploadedTime}</td>
        </tr>
        );
        
        return (
            <div className='container'>
                <h2>Files To Trancribe</h2>
                <br/>
                <Table striped bordered hover size="sm" className="table">
                    <thead>
                        <tr>
                            <th>File Name</th>
                            <th>Status</th>
                            <th>Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        {totalFileList}
                    </tbody>
                </Table>
                <Button className="resetButton float-end" variant="outline-primary" onClick={()=> {this.resetTable()}}>Clear Table</Button>
            </div>
        );
    }
}

export default FileList;


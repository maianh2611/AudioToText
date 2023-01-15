import React from 'react';
import Form from "react-bootstrap/Form";
import Button from 'react-bootstrap/esm/Button';
import './FileForm.css';

class FileForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            errorMessage : ''
        }
    }

    render() {
        return (
            <Form onSubmit={(event) => {this.props.handleSubmit(event)}}>
                <Form.Group className="mb-3">
                    <Form.Label>
                        Upload a file:
                        <Form.Control type="file" name="file" accept="audio/*"/>
                    </Form.Label>
                </Form.Group>
                {this.state.errorMessage !== '' ? <div className="alert alert-danger" role="alert"> {this.state.errorMessage} </div> : ''}
                <Button type="submit">Submit</Button>
            </Form>
        );
    }
}

export default FileForm;
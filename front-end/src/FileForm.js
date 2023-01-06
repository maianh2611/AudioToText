import React from 'react';
import Form from "react-bootstrap/Form";
import Button from 'react-bootstrap/esm/Button';

class FileForm extends React.Component {
    constructor(props) {
        super(props);
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
                <Button type="submit">Submit</Button>
            </Form>
        );
    }
}

export default FileForm;
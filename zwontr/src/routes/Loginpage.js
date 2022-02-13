import "../App.scss";
import { Form, Button } from "react-bootstrap";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect } from "react";

function Loginpage() {
  let history = useHistory();

  return (
    <div>
      <h1 className="">Zwon Center Manage Page</h1>
      <Form className="loginBox">
        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Label>ID</Form.Label>
          <Form.Control type="text" placeholder="Enter ID" />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control type="password" placeholder="Password" />
        </Form.Group>
        <Form.Group className="mb-3" controlId="formBasicCheckbox"></Form.Group>
        <Button
          variant="primary"
          type="submit"
          onClick={() => {
            history.push("/studentList");
          }}
        >
          Login
        </Button>
      </Form>
    </div>
  );
}

export default Loginpage;

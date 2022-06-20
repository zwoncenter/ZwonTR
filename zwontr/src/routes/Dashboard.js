import "./Dashboard.css";
import { Form, Button, Card, ListGroup, Table, Modal, Row, Col } from "react-bootstrap";
import { useHistory, useParams } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import TimePicker from "react-time-picker";
import menuarrow from "../next.png";

function Dashboard() {
    return(
    <div className="dashboard-background">
        <div className="dashboard-bigbox">
            <div className="dashcard profilebox">

            </div>
            <div className="dashcard contentbox">

            </div>
        </div>
    </div>

);
}

export default Dashboard;
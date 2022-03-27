import "./StuInfo.scss";
import "./StuListpage practice.scss";
import { Button, Card, ListGroup, Modal } from "react-bootstrap";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect } from "react";
import axios from "axios";

function StuInfo(props){
    let history = useHistory();

    return (
        <div className="stuInfo-background">
            <h2 className="fw-bold text-center">
                <strong>학생 기본정보</strong>
            </h2>
            <div className="stuInfoCard mt-3">
                <p>테스트용 카드</p>
            </div>

            <div className="stuInfoCard mt-3">
                <p>테스트용 카드</p>
            </div>

            <div className="stuInfoCard mt-3">
                <p>테스트용 카드</p>
            </div>
            
        </div>
    );
}

export default StuInfo;
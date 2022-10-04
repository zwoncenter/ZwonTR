import React, { Component } from "react";
import Draggable from "react-draggable";
import { Button, Card, ListGroup, Modal, Table } from "react-bootstrap";
import { useState, useEffect } from "react";

// import StuListpage from './StuListpage';
import StuListpage from "./StuListpage";

function StickyNote({id, x_pos, y_pos, textdata, addNote}){
    const [position, setPosition] = useState({ x: x_pos, y: y_pos }); // box의 포지션 값
    const [memo, setmemo] = useState([textdata]);
    // // 업데이트 되는 값을 set 해줌
    const trackPos = (data) => {
      setPosition({ x: data.x, y: data.y });
    };
  
    // const { id, x, y, data } = this.props;
    return (
      <Draggable onDrag={(e, data) => trackPos(data)}>
        <div className="stickynote">
          <Button
            className="stuAddbtn"
            onclick={(event) => {
                addNote();
            }}
          >
            +
          </Button>
          <strong>
            <p className="m-0">업무공유사항</p>
          </strong>
          <textarea
            placeholder="여기에 입력하세요"
              value={memo}
              onChange={(e) => {
                let newstickynote = JSON.parse(JSON.stringify(memo));
                newstickynote = e.target.value;
                setmemo(newstickynote);
              }}
            //   onBlur={() => {
            //     console.log(stickynoteValue);
            //     axios
            //       .put("/api/stickynote", stickynoteValue)
            //       .then(function (result) {
            //         if (result.data === true) {
            //           history.push("/studentList");
            //         } else if (result.data === "로그인필요") {
            //           window.alert("로그인이 필요합니다.");
            //           return history.push("/");
            //         } else {
            //           console.log(result.data);
            //           window.alert(result.data);
            //         }
            //       })
            //       .catch(function (err) {
            //         console.log("저장 실패 : ", err);
            //         window.alert(err);
            //       });
            //   }}
          ></textarea>
          <p>* 작성/수정 후 메모장 바깥을 눌러야 저장됩니다.</p>
        </div>
      </Draggable>
    );
  }

StickyNote.defaultProps = {
    x: 0, //구현 가능해지면 random좌표로 초기화할 것
    y: 0,
    data: ""
}

export default StickyNote;


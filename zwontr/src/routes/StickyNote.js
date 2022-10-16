import React, { Component } from "react";
import Draggable from "react-draggable";
import { Button, Card, ListGroup, Modal, Table } from "react-bootstrap";
import { useState, useEffect } from "react";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import axios from "axios";

// import StuListpage from './StuListpage';
import StuListpage from "./StuListpage";
import { useCallback } from "react";

const StickyNote = ({ id, x_pos, y_pos, textdata, addNote, deleteNote }) => {
  const [position, setPosition] = useState({ x: x_pos, y: y_pos }); // box의 포지션 값
  const [memo, setmemo] = useState(textdata);
  // // 업데이트 되는 값을 set 해줌
  const trackPos = (data) => {
    setPosition({ x: data.x, y: data.y });
    // console.log(position, memo);
  };

  const conductAddNote = useCallback(() => {
    addNote();
  });
  const conductDeleteNote = useCallback(() => {
    deleteNote();
  });

  return (
    <Draggable onDrag={(e, data) => trackPos(data)} defaultPosition={{ x: x_pos, y: y_pos }}>
      <div className="stickynote">
        <div>
          <Button className="memoAddOrDelete" onClick={conductAddNote} variant="secondary">
            +
          </Button>
          <Button className="memoNone" variant="dark">_</Button>
          <Button
            className="memoAddOrDelete"
            variant="secondary"
            onClick={async () => {
              if (window.confirm(`현재 작성중인 메모를 삭제하시겠습니까?`)) {
                const foundID = id;
                await axios
                  .delete(`/api/stickynote/${foundID}`)
                  .then(function (result) {
                    if (result.data === true) {
                    } else if (result.data === "로그인필요") {
                      window.alert("로그인이 필요합니다.");
                    } else {
                      console.log(result.data);
                      window.alert(result.data);
                    }
                  })
                  .catch(function (err) {
                    console.log("저장 실패 : ", err);
                    window.alert(err);
                  });
                await conductDeleteNote();
              }
            }}
          >
            x
          </Button>
        </div>
        <textarea
          placeholder="여기에 입력하세요"
          value={memo}
          onChange={(e) => {
            let newstickynote = e.target.value;
            console.log("check: ", newstickynote);
            setmemo(newstickynote);
          }}
          onBlur={() => {
            console.log(JSON.stringify(memo));
            const changedNote = {
              _id: id,
              note: memo,
              x: position.x,
              y: position.y,
            };
            console.log(changedNote);
            axios
              .put(`/api/stickynote/${changedNote["_id"]}`, changedNote)
              .then(function (result) {
                if (result.data === true) {
                } else if (result.data === "로그인필요") {
                  window.alert("로그인이 필요합니다.");
                } else {
                  console.log(result.data);
                  window.alert(result.data);
                }
              })
              .catch(function (err) {
                console.log("저장 실패 : ", err);
                window.alert(err);
              });
          }}
        ></textarea>
        <p>* 작성/수정 후 메모장 바깥을 눌러야 저장됩니다.</p>
      </div>
    </Draggable>
  );
};

export default StickyNote;

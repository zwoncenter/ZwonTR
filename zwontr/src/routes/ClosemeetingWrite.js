import "./Closemeeting.css"
import { Form, Button, Card, ListGroup, Table, Modal, Row, Col } from "react-bootstrap";
import { useHistory, useParams } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import TimePicker from "react-time-picker";
import menuarrow from "../next.png";

function ClosemeetingWrite() {
  let history = useHistory();
  const [date, setdate] = useState(new Date().toISOString().split("T")[0]);
  const [todayTRlist, settodayTRlist] = useState([]);
  useEffect(async () => {
    const newtodayTRlist = await axios
      .get(`/api/TRlist/2022-05-10`)
      .then((result) => {
        if (result.data === "로그인필요") {
          window.alert("로그인이 필요합니다");
          return history.push("/");
        }
        return result.data;
      })
      .catch((err) => {
        return err;
      });

    if (newtodayTRlist && newtodayTRlist == "로그인필요") {
      window.alert("로그인이 필요합니다.");
      return history.push("/");
    }
    newtodayTRlist.sort(function (a, b) {
      return +(a.이름 > b.이름) - 0.5;
    });
    settodayTRlist(newtodayTRlist);
  }, []);

  return (
    <div className="trEdit-background">
      <div className="menu">
        <div className="menu-map">
          <Button
            className="menu-map-btn btn-secondary"
            onClick={() => {
              history.push("/studentList");
            }}
          >
            <h5>
              <strong>학생 관리</strong>
            </h5>
          </Button>
          <Button
            className="menu-map-btn btn-secondary"
            onClick={() => {
              history.push("/Closemeeting/Write");
            }}
          >
            <h5>
              <strong>마감 회의</strong>
            </h5>
          </Button>
          <Button
            className="menu-map-btn btn-secondary"
            onClick={() => {
              window.alert("준비중입니다!");
            }}
          >
            <h5>
              <strong>매니저 업무리스트</strong>
            </h5>
          </Button>
          <Button
            className="menu-map-btn btn-secondary"
            onClick={() => {
              window.alert("준비중입니다!");
            }}
          >
            <h5>
              <strong>대시보드</strong>
            </h5>
          </Button>
        </div>
        <div className="menuArrow">
          <img src={menuarrow} alt="menuarrow" />
        </div>
      </div>
      <h3>{date} 마감 회의</h3>
      <h4>현재는 저장이 불가능하며, 참고용으로 사용하시길 바랍니다.</h4>
      {/* <Button
        onClick={() => {
          console.log(todayTRlist[0]);
        }}
      >
        TR 첫번째 확인
      </Button> */}
      <Button className="btn-commit btn-save"
      
      onClick={() => {
        // if (window.confirm("마감회의 내용을 저장하시겠습니까?")) {
          window.alert("베타 버전입니다. 저장이 불가능합니다.")
        // }
      }}>
        마감 회의 저장
      </Button>
      <Table striped hover size="sm" className="mt-3">
        <thead>
          <tr>
            <th width="3%">이름</th>
            <th width="3%">취침</th>
            <th width="3%">기상</th>
            <th width="3%">등원</th>
            <th width="3%">귀가</th>
            <th width="2%">학습</th>
            <th width="2%">자기계발</th>
            <th width="15%">매니저 피드백</th>
            <th width="15%">마감 회의 피드백</th>
          </tr>
        </thead>
        <tbody>
          {todayTRlist.map(function (tr, index) {
            return (
              <tr key={index}>
                <td>
                  <p>{tr["이름"]}</p>
                </td>
                <td>
                  <p>{tr["실제취침"]}</p>
                </td>
                <td>
                  <p>{tr["실제기상"]}</p>
                </td>
                <td>
                  <p>{tr["실제등원"]}</p>
                </td>
                <td>
                  <p>{tr["실제귀가"]}</p>
                </td>
                <td>
                  <p>{tr["실제학습"]}</p>
                </td>
                <td>
                  <p>{tr["프로그램시간"]}</p>
                </td>
                <td>
                <p>{tr["작성매니저"] + " : " + tr["매니저피드백"]}</p>
                </td>
                <td>
                  <textarea className="textArea" rows="3"></textarea>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}

export default ClosemeetingWrite;

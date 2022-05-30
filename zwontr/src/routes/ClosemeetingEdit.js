import "./Closemeeting.css"
import { Form, Button, Card, ListGroup, Table, Modal, Row, Col } from "react-bootstrap";
import { useHistory, useParams } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import TimePicker from "react-time-picker";
import menuarrow from "../next.png";

function ClosemeetingEdit() {
  let history = useHistory();
  const [objectid, setobjectid] = useState("");
  const [date, setdate] = useState(useParams()["date"]);
  const [todayTRlist, settodayTRlist] = useState([]);
  const [selectedDate, setselectedDate] = useState("");

  useEffect(async () => {
    const document = await axios
      .get(`/api/Closemeeting/find/${date}`)
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
    console.log(document)
    const closemeeting = document["trlist"];
    setobjectid(document["_id"])
  
    if (closemeeting && closemeeting == "로그인필요") {
      window.alert("로그인이 필요합니다.");
      return history.push("/");
    }
    console.log(closemeeting);
    closemeeting.sort(function (a, b) {
      return +(a.이름 > b.이름) - 0.5;
    });
    settodayTRlist(closemeeting);
  }, []);

  return (
    <div>

    <div className="trEdit-background">
      
      <h3>{date} 마감 회의</h3>
      <Button className="btn-commit btn-save"
      onClick={() => {
        if (window.confirm("마감회의 내용을 저장하시겠습니까?")) {
          axios
            .put(`/api/Closemeeting/edit/${date}`, {
              _id : objectid,
              날짜 : date,
              trlist : todayTRlist
            })
            .then(function (result) {
              if (result.data === true) {
                window.alert("저장되었습니다.");
              } else if (result.data === "로그인필요") {
                window.alert("로그인이 필요합니다.");
                return history.push("/");
              } else {
                console.log(result.data);
                window.alert(result.data);
              }
            })
            .catch(function (err) {
              console.log("저장 실패 : ", err);
              window.alert(err);
            });
        }
      }}>
        마감 회의 저장
      </Button>

      <Button
          variant="secondary"
          className="btn-commit btn-load loadButton"
          onClick={() => {
            if (selectedDate !== "") {
              axios
                .get(`/api/Closemeeting/find/${selectedDate}`)
                .then((result) => {
                  if (result["data"] === null) {
                    if (window.confirm("해당 날짜의 마감회의가 존재하지 않습니다. 새로 작성하시겠습니까?")) {
                      history.push(`/Closemeeting/Write/${selectedDate}`);
                    }
                  } else {
                    if (window.confirm(`${selectedDate}의 마감회의로 이동하시겠습니까?`)) {
                      history.push(`/Closemeeting/Edit/${selectedDate}`);
                    }
                  }
                })
                .catch((err) => {
                  console.log(err);
                });
            }
          }}
        >
          <div className="row m-0">
            <div className="col-xl-7">
              <strong>다른 일자 작성/조회</strong>
            </div>
            <div className="col-xl-5">
              <input
                type="date"
                className="w-100"
                value={selectedDate}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                onChange={(e) => {
                  e.stopPropagation();
                  setselectedDate(e.target.value);
                }}
              />
            </div>
          </div>
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
                {tr["결석여부"] ? 
                <td colSpan={6}>미등원 - {tr["결석사유"]}</td> :
                <>
                  <td>
                    <p className={tr["취침차이"] >= 0 ? "green" : "red"}>{tr["실제취침"]}</p>
                  </td>
                  <td >
                    <p className={tr["기상차이"] >= 0 ? "green" : "red"}>{tr["실제기상"]}</p>
                  </td>
                  <td >
                    <p className={tr["등원차이"] >= 0 ? "green" : "red"}>{tr["실제등원"]}</p>
                  </td>
                  <td>
                    <p>{tr["실제귀가"]}</p>
                  </td>
                  <td >
                    <p className={tr["학습차이"] >= 0 ? "green" : "red"}>{tr["실제학습"]}</p>
                  </td>
                  <td>
                    <p>{tr["프로그램시간"]}</p>
                  </td>
                </>
                }
                
                <td>
                <p>{tr["작성매니저"] + " : " + tr["매니저피드백"]}</p>
                </td>
                <td>
                  <textarea className="textArea" rows="3" value={tr["마감회의피드백"]} onChange={(e) => {
                    const newtodayTRlist = [...todayTRlist];
                    newtodayTRlist[index]["마감회의피드백"] = e.target.value
                    settodayTRlist(newtodayTRlist)
                    }}></textarea>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
    </div>
  );
}

export default ClosemeetingEdit;

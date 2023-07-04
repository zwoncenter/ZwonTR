import "./Closemeeting.css";
import { Form, Button, Card, ListGroup, Table, Modal, Row, Col } from "react-bootstrap";
import { useHistory, useParams } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import TimePicker from "react-time-picker";
import menuarrow from "../next.png";

function ClosemeetingEdit({
  setNowLoading,
  setNowNotLoading,
  myInfo,
}) {
  let history = useHistory();
  let paramDate = useParams()["date"];
  let date = new Date(paramDate);

  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const [todayTRlist, settodayTRlist] = useState([]);
  const [closeFeedback, setcloseFeedback] = useState({});
  const [selectedDate, setselectedDate] = useState("");

  // const [objectid, setobjectid] = useState("");

  // 일일결산 피드백 작성 매니저 관련 코드
  const [managerList, setmanagerList] = useState(["전체보기","작성하기"]);
  const [currentWritingManager, setCurrentWritingManager]= useState({});
  function updateCurrentWritingManager(fieldName,value){
    setCurrentWritingManager((prevData)=>{
      const newData=JSON.parse(JSON.stringify(prevData));
      newData[fieldName]=value;
      return newData;
    });
  }
  function checkTextAreaDisabled(selectValue){
    // console.log("select value:"+JSON.stringify(selectValue));
    // console.log("disabled:"+JSON.stringify(!selectValue || selectValue==="전체보기"));
    return !selectValue || selectValue==="전체보기";
  }
  function getFeedbackHash(studentName,managerName){
    return studentName+"@"+managerName;
  }
  function processCloseMeetingFeedbackData(feedbackData){
    const ret={};
    // console.log("closefeedback:"+JSON.stringify(feedbackData));
    Object.keys(feedbackData).forEach((feedback_hash,idx)=>{
      ret[feedback_hash]={"updated":false,"content":feedbackData[feedback_hash]};
    });
    return ret;
  }
  function getUpdatedCloseMeetingFeedbackData(feedbackData){
    const ret={};
    Object.keys(feedbackData).forEach((feedback_hash,idx)=>{
      if(!feedbackData[feedback_hash]["updated"]) return;
      ret[feedback_hash]=feedbackData[feedback_hash]["content"];      
    });
    return ret;
  }
  function getAllFeedbackByStudentName(studentName){
    let ret="";
    Object.keys(closeFeedback).forEach((feedback_hash,idx)=>{
      let [student_name,manager_name]=feedback_hash.split("@");
      if(student_name!==studentName) return;
      if(!manager_name) manager_name="2023-03 이전 작성";
      ret+=`[${manager_name}]\n${closeFeedback[feedback_hash]["content"]}\n\n`
    })
    return ret;
  }
  function getMyFeedbackContentByStudentName(studentName){
    const my_nickname=myInfo.nickname;
    const feedback_hash=getFeedbackHash(studentName,my_nickname);
    const ret=getFeedbackContentByFeedbackHash(feedback_hash);
  }
  function getFeedbackContentByFeedbackHash(feedbackHash){
    const[student_name,manager_name]=feedbackHash.split("@");
    if(manager_name==="전체보기") return getAllFeedbackByStudentName(student_name);
    else if(feedbackHash in closeFeedback) return closeFeedback[feedbackHash]["content"];
    else return "";
  }
  const feedback_data_template={"updated":false,"content":""};

  useEffect(async () => {
    let document = await axios
      .get(`/api/Closemeeting/${paramDate}`)
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
    // setobjectid(document["_id"]);
    // console.log(`prev feedback data: ${JSON.stringify(document)}`);
    
    if(document) {
      setcloseFeedback(processCloseMeetingFeedbackData(document["closeFeedback"]));
      // console.log("processed:"+JSON.stringify(processCloseMeetingFeedbackData(document["closeFeedback"])));
    }
    else setcloseFeedback({});

    const newtodayTRlist = await axios
      .get(`/api/TRlist/${paramDate}`)
      .then((result) => {
        const data=result.data;
        if (result.data === "로그인필요") {
          window.alert("로그인이 필요합니다");
          return history.push("/");
        }
        else if(data.success===true) return data.ret;
        else throw new Error(data.ret);
        // return result.data;
      })
      .catch((err) => {
        return err;
      });

    newtodayTRlist.sort(function (a, b) {
      return +(a.이름 > b.이름) - 0.5;
    });
    // console.log("today tr list:"+JSON.stringify(newtodayTRlist));
    settodayTRlist(newtodayTRlist);
  }, [paramDate]);

  // useEffect(async ()=>{
  //   const newmanagerList = await axios
  //       .get("/api/managerList")
  //       .then((result) => {
  //         const data=result.data;
  //         if(data.success===true) return data.ret;
  //         else throw new Error(data.ret);
  //         // return result["data"];
  //       })
  //       .catch((err) => {
  //         return err;
  //       });
  //   // console.log("manager list:"+JSON.stringify(managerList));
  //   newmanagerList.unshift("전체보기");
  //   setmanagerList(newmanagerList);
  // },[]);

  return (
    <div>
      <div className="trEdit-background">
        <h3>
          {paramDate} ({days[date.getDay()]}) 일일 결산
        </h3>

        <Button
          className="btn-commit btn-save"
          onClick={() => {
            if (window.confirm("일일결산 내용을 저장하시겠습니까?")) {
              // axios
              //   .put(`/api/Closemeeting/${paramDate}`, {
              //     _id: objectid,
              //     날짜: paramDate,
              //     closeFeedback: closeFeedback,
              //   })
              //   .then(function (result) {
              //     if (result.data === true) {
              //       window.alert("저장되었습니다.");
              //       return window.location.reload();
              //     } else if (result.data === "로그인필요") {
              //       window.alert("로그인이 필요합니다.");
              //       return history.push("/");
              //     } else {
              //       console.log(result.data);
              //       window.alert(result.data);
              //     }
              //   })
              //   .catch(function (err) {
              //     console.log("저장 실패 : ", err);
              //     window.alert(err);
              //   });
              const post_body={dateString:paramDate,updatedFeedback:getUpdatedCloseMeetingFeedbackData(closeFeedback)};
              // console.log("post body:"+JSON.stringify(post_body));
              axios
                .post(`/api/SaveClosemeetingFeedback`,post_body)
                .then((result)=>{
                  const data=result.data;
                  if (result.data === "로그인필요") {
                    window.alert("로그인이 필요합니다.");
                    return history.push("/");
                  }
                  else if(data.success===true){
                    window.alert("저장되었습니다");
                    return window.location.reload();
                  }
                  else throw new Error(data.ret);
                })
                .catch((err)=>{
                  window.alert(err);
                });
            }
          }}
        >
          일일결산 저장
        </Button>

        <Button
          variant="secondary"
          className="btn-commit btn-load loadButton"
          onClick={() => {
            // if (selectedDate !== "") {
            //   axios
            //     .get(`/api/Closemeeting/${selectedDate}`)
            //     .then((result) => {
            //       if (result["data"] === null) {
            //         if (window.confirm("해당 날짜의 일일결산이 존재하지 않습니다. 새로 작성하시겠습니까?")) {
            //           history.push(`/Closemeeting/Write/${selectedDate}`);
            //         }
            //       } else {
            //         if (window.confirm(`${selectedDate}의 일일결산으로 이동하시겠습니까?`)) {
            //           history.push(`/Closemeeting/Edit/${selectedDate}`);
            //         }
            //       }
            //     })
            //     .catch((err) => {
            //       console.log(err);
            //     });
            // }
            if (window.confirm(`${selectedDate}의 일일결산으로 이동하시겠습니까?`)) {
              history.push(`/Closemeeting/${selectedDate}`);
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
              <th width="4%">이름</th>
              <th width="4%">취침</th>
              <th width="4%">기상</th>
              <th width="4%">등원</th>
              <th width="4%">귀가</th>
              <th width="4%">학습</th>
              <th width="4%">자기계발</th>
              <th width="23%">매니저 피드백</th>
              <th width="8%">일일결산<br/>작성 매니저</th>
              <th width="41%">일일결산 피드백</th>
            </tr>
          </thead>
          <tbody>
            {todayTRlist.map(function (tr, index) {
              const student_name=tr["이름"];
              const current_writing_manager=currentWritingManager[student_name]?currentWritingManager[student_name]:"전체보기";
              
              const feedback_hash=getFeedbackHash(student_name,current_writing_manager);
              return (
                <tr key={index}>
                  <td>
                    <p>{student_name}</p>
                  </td>
                  {tr["결석여부"] ? (
                    <td colSpan={6}>
                      <p className="abscent">
                        {" "}
                        {tr["결석여부"] === true ? (
                          <>
                            미등원 - {tr["결석사유"]} : {tr["결석상세내용"]}{" "}
                          </>
                        ) : (
                          <>등원예정</>
                        )}{" "}
                      </p>
                    </td>
                  ) : (
                    <>
                      <td>
                        <p className={tr["취침차이"] >= 0 ? "green" : "red"}>{tr["실제취침"]}</p>
                      </td>
                      <td>
                        <p className={tr["기상차이"] >= 0 ? "green" : "red"}>{tr["실제기상"]}</p>
                      </td>
                      <td>
                        <p className={tr["등원차이"] >= -0.17 ? "green" : tr["등원차이"] >= -1 ? "yellow" : "red"}>{tr["실제등원"]}</p>
                        <p className="targetattend">{tr["목표등원"]}</p>
                      </td>
                      <td>
                        <p>{tr["작성매니저"] ? tr["실제귀가"] : "귀가 전"}</p>
                      </td>
                      <td>
                        <p className={tr["학습차이"] >= 0 ? "green" : "red"}>{tr["실제학습"]}</p>
                      </td>
                      <td>
                        <p>{tr["프로그램시간"]}</p>
                      </td>
                    </>
                  )}

                  <td>
                    {tr["중간피드백"] ? (
                      <>
                        <p>
                          (중간) {tr["중간매니저"]} : {tr["중간피드백"]}
                        </p>
                        <br />
                      </>
                    ) : null}
                    {tr["매니저피드백"] ? (
                      <>
                        <p>
                          {tr["작성매니저"]} : {tr["매니저피드백"]}
                        </p>
                      </>
                    ) : null}
                  </td>
                  <td>
                    <Form.Select
                        size="sm"
                        className="feedback-sub"
                        value={currentWritingManager[student_name]}
                        onChange={(e) => {
                          // console.log("select:"+JSON.stringify(e.target.value));
                          // const dict_copy={...currentWritingManager};
                          // dict_copy[student_name]=e.target.value;
                          // setCurrentWritingManager(dict_copy);
                          const value=e.target.value;
                          updateCurrentWritingManager(student_name,value);
                        }}
                        defaultValue={"전체보기"}
                    >
                      {/* <option value="선택">선택</option> */}
                      {managerList
                          ? managerList.map((prompt, index) => {
                            return (
                                <option value={prompt==="작성하기"?myInfo.nickname:prompt} key={index}>
                                  {prompt}
                                </option>
                            );
                          })
                          : null}
                    </Form.Select>
                  </td>
                  <td>
                    <textarea
                      className="textArea"
                      rows="3"
                      value={getFeedbackContentByFeedbackHash(feedback_hash)}
                      disabled={checkTextAreaDisabled(current_writing_manager)}
                      onChange={(e) => {
                        const newcloseFeedback = JSON.parse(JSON.stringify(closeFeedback));
                        if(!(feedback_hash in newcloseFeedback)) newcloseFeedback[feedback_hash]={...feedback_data_template};
                        newcloseFeedback[feedback_hash]["updated"] = true;
                        newcloseFeedback[feedback_hash]["content"] = e.target.value;
                        // console.log("cf new:"+JSON.stringify(newcloseFeedback));
                        setcloseFeedback(newcloseFeedback);
                      }}
                    ></textarea>
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

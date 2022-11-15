import { Button, Card, ListGroup, Modal, Table, InputGroup, Form } from "react-bootstrap";
import { Typeahead } from 'react-bootstrap-typeahead';
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect } from "react";
import axios from "axios";
import "./Lecture.css";
import 'react-bootstrap-typeahead/css/Typeahead.css';
import { FaPencilAlt, FaTimes } from "react-icons/fa";

function LectureList() {
  let history = useHistory();
  
  // 날짜 관련 코드
  const now = new Date(); // 현재 시간
  const utcNow = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const koreaTimeDiff = 9 * 60 * 60 * 1000;
  const koreaNow = new Date(utcNow + koreaTimeDiff);
  const today = koreaNow.toISOString().split("T")[0];

  // 강의 정렬 관련 코드

  const [managerOn, setmanagerOn] = useState(false);
  const [startdayOn, setstartdayOn] = useState(false);

  // 강의 추가 관련 코드
  const [modal, setmodal] = useState(false);
  const modalOpen = () => setmodal(true);
  const modalClose = () => setmodal(false);
  const createNewLecture = () => {
    if (lecture["lectureName"] === "") {
      window.alert("강의명이 입력되지 않았습니다.");
      return;
    }

    if (lecture["subject"] === "") {
      window.alert("과목이 선택되지 않았습니다.");
      return;
    }

    if (lecture["manager"] === "") {
      window.alert("담당 매니저가 선택되지 않았습니다.");
      return;
    }
    if (lecture["startday"] === "") {
      window.alert("강의시작일이 입력되지 않았습니다.");
      return;
    }

    axios
      .post(`/api/Lecture`, lecture)
      .then((result) => {
        if (result.data === true) {
          window.location.replace("/Lecture");
        } else if (result.data === "로그인필요") {
          window.alert("로그인이 필요합니다.");
          return history.push("/");
        } else {
          window.alert(result.data);
        }
      })
      .catch((err) => {
        window.alert(err);
      });
  };

  //강의 추가 시 교재 선택 관련 코드
  const [textBookNeedFlag,setTextBookNeedFlag]= useState(false);
  const [textBookList,setTextBookList]=useState([]);
  // const [selectedBookList,setSelectedBookList]=useState([]);

  useEffect(async ()=>{
    if(!textBookNeedFlag) return;
    const textBookListDocument= await axios
    .get(`/api/Textbook`)
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
    const newTextBookList= textBookListDocument["textbookList"];
    setTextBookList(newTextBookList);
  },[textBookNeedFlag]);

  const [lecture, setlecture] = useState({
    lectureID: "",
    lectureName: "",
    subject: "",
    manager: "",
    startday: today,
    lastrevise: today,
    students: {},
    studentList: [],
    textbookIDArray: [],
    assignments: {},
    assignKey: 0,
  });

  // 강의 수정 관련 코드
  const [reviseModal, setreviseModal] = useState(false);
  const [existlecture, setexistlecture] = useState({});
  const [existlectureTextbookList,setExistlectureTextbookList] = useState([]); // textbooks of exist lecture

  const reviseModalOpen = async (lecture) => {
    setexistlecture(lecture);
    setreviseModal(true);
    //here we get textbooks of specific lecture to be revised
    const newExistlectureTextbookList = await axios
      .get(`/api/TextbookOfLecture/${lecture["lectureID"]}`)
      .then((result) => {
        if (result.data === "로그인필요") {
          window.alert("로그인이 필요합니다.");
          return history.push("/");
        }
        return result["data"];
      })
      .catch((err) => {
        return err;
      });
    setExistlectureTextbookList(newExistlectureTextbookList);
  };

  const reviseModalClose = () => {
    setexistlecture({});
    setreviseModal(false);
    setExistlectureTextbookList([]);
  };

  const reviseLecture = async () => {
    if (existlecture["lectureName"] === "") {
      window.alert("강의명이 입력되지 않았습니다.");
      return;
    }

    if (existlecture["subject"] === "") {
      window.alert("과목이 선택되지 않았습니다.");
      return;
    }

    if (existlecture["manager"] === "") {
      window.alert("담당 매니저가 선택되지 않았습니다.");
      return;
    }
    if (existlecture["startday"] === "") {
      window.alert("강의시작일이 입력되지 않았습니다.");
      return;
    }

    if (!window.confirm("강의를 수정하시겠습니까?")) return;
    axios
      .put("/api/Lecture", existlecture)
      .then((result) => {
        if (result.data === true) {
          window.alert("수정되었습니다");
          return window.location.replace("/Lecture");
        } else if (result.data === "로그인필요") {
          window.alert("로그인이 필요합니다.");
          return history.push("/");
        } else {
          console.log(result.data);
          window.alert(result.data);
        }
      })
      .catch((err) => {
        return window.alert("수정에 실패했습니다", err);
      });
  };

  // 강의 삭제 관련 코드
  const deleteLecture = async (studentList, lecture) => {
    if (!window.confirm(`${lecture["lectureName"]} 강의를 삭제하시겠습니까?`)) return;
    for (let student of studentList) {
      const stuDB = await axios
        .get(`/api/StudentDB/${student}`)
        .then((result) => {
          if (result.data === "로그인필요") {
            window.alert("로그인이 필요합니다.");
            return history.push("/");
          }
          return result["data"];
        })
        .catch((err) => {
          return err;
        });
      // 학생DB에 수강중강의가 있는지, 수강중강의에 해당 lectureID가 존재하는지부터 확인해야하긴 함.

      await stuDB["수강중강의"].splice(stuDB["수강중강의"].indexOf(lecture["lectureID"]), 1);
      console.log(stuDB["수강중강의"]);
      axios
        .put("/api/StudentDB", stuDB)
        .then(function (result) {
          if (result.data === "로그인필요") {
            window.alert("로그인이 필요합니다.");
            return history.push("/");
          }
          if (result.data !== true) {
            window.alert(result.data);
          }
        })
        .catch(function (err) {
          window.alert("저장에 실패했습니다 개발/데이터 팀에게 문의해주세요");
        });
    }
    axios
      .delete(`/api/Lecture/${lecture["lectureID"]}`)
      .then((result) => {
        if (result.data === true) {
          window.alert("삭제되었습니다");
          return window.location.replace("/Lecture");
        } else {
          window.alert(result.data);
        }
      })
      .catch((err) => {
        window.alert(`삭제에 실패했습니다. ${err}`);
      });
  };


  function groupBy(list, fn){
    const groups = {};
    list.forEach(function (o) {
        const group = JSON.stringify(fn(o));
        groups[group] = groups[group] || [];
        groups[group].push(o);
    });
    return groups;
}

  // 매니저리스트 관련 코드
  const [managerList, setmanagerList] = useState([]);

  // 강의리스트 관련 코드
  const [lectureList, setlectureList] = useState([]);

  useEffect(async () => {
    const newmanagerList = await axios
      .get("/api/managerList")
      .then((result) => {
        //console.log(result["data"]);
        return result["data"];
      })
      .catch((err) => {
        return err; 
      });
    setmanagerList(newmanagerList);

    const newlectureList = await axios
      .get("/api/Lecture")
      .then((result) => {
        return result["data"];
      })
      .catch((err) => {
        return window.alert(err);
      });
    setlectureList(newlectureList);
  }, []);

  // 강의리스트를 매니저 이름별로 groupby
  const groupedlectureList = groupBy(lectureList,(element)=>{
    return element.manager
  });

  // 강의-학생 relation 불러오기
  const [studentOfLecture, setstudentOfLecture] = useState([]);
  useEffect(async () => {
    const newstudentOfLecture = await axios
      .get("/api/StudentOfLecture")
      .then((result) => {
        return result["data"];
      })
      .catch((err) => {
        return window.alert(err);
      });
      setstudentOfLecture(newstudentOfLecture);
  }, []);

  // 강의ID 별로 학생 ID를 groupby
  const attendingStudentList= {};
  studentOfLecture.map((element,idx)=>{
    attendingStudentList[element["lectureID"]]=attendingStudentList[element["lectureID"]] || 0;
    attendingStudentList[element["lectureID"]]+=1;
    return false;
  });

  return (
    <div className="background text-center">
      <h1 className="mt-3 fw-bold">강의 관리</h1>

      {/* 강의 생성 Modal */}
      <Modal show={modal} onHide={modalClose}>
        <Modal.Header closeButton>
          <Modal.Title>강의 추가</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <InputGroup className="mb-3">
            <InputGroup.Text> 강의명</InputGroup.Text>
            <Form.Control
              placeholder="강의명을 입력해주세요"
              onChange={(e) => {
                const regExp = /[#?\/\\%]/gi;
                if (regExp.test(e.target.value)) {
                  alert("#,?,\\ /는 입력하실수 없습니다.");
                  e.target.value = e.target.value.substring(0, e.target.value.length - 1);
                  return;
                }
                const newlecture = {...lecture};
                newlecture["lectureName"] = e.target.value;
                if (newlecture["lectureName"] !== "" && newlecture["manager"] !== "" && newlecture["startday"] !== "") {
                  newlecture["lectureID"] =
                    newlecture["lectureName"] +
                    "_" +
                    newlecture["manager"] +
                    "_" +
                    newlecture["startday"].slice(2, 4) +
                    newlecture["startday"].slice(5, 7) +
                    newlecture["startday"].slice(8, 10);
                }
                setlecture(newlecture);
              }}
            />
          </InputGroup>
          <InputGroup className="mb-3">
            <InputGroup.Text>과목</InputGroup.Text>
            <Form.Select
              onChange={(e) => {
                const newlecture = {...lecture};
                newlecture["subject"] = e.target.value;
                setlecture(newlecture);
              }}
            >
              <option value="">선택</option>
              {["국어", "수학", "영어", "탐구", "기타"].map((subject, idx) => {
                return (
                  <option value={subject} key={idx}>
                    {subject}
                  </option>
                );
              })}
            </Form.Select>
          </InputGroup>
          <InputGroup className="mb-3">
            <InputGroup.Text>교재</InputGroup.Text>
            <Typeahead
              id="select_lecture_textbook"
              multiple
              onChange={(selected)=>{
                //console.log(selected);
                const newlecture= {...lecture};
                //setSelectedBookList(selected);
                //console.log('sbl: '+JSON.stringify(selectedBookList));
                newlecture["textbookIDArray"]=selected.map((element,idx)=>{
                  return element["_id"];
                });
                console.log("new lecture: "+JSON.stringify(newlecture));
                setlecture(newlecture);
              }}
              options={textBookList}
              labelKey="교재"
            />
          </InputGroup>
          <InputGroup className="mb-3">
            <InputGroup.Text>매니저(강사)</InputGroup.Text>
            <Form.Select
              onChange={(e) => {
                const newlecture = {...lecture};
                newlecture["manager"] = e.target.value;
                if (newlecture["lectureName"] !== "" && newlecture["manager"] !== "" && newlecture["startday"] !== "") {
                  newlecture["lectureID"] =
                    newlecture["lectureName"] +
                    "_" +
                    newlecture["manager"] +
                    "_" +
                    newlecture["startday"].slice(2, 4) +
                    newlecture["startday"].slice(5, 7) +
                    newlecture["startday"].slice(8, 10);
                }
                setlecture(newlecture);
              }}
            >
              <option value="">선택</option>
              {managerList.map((manager, idx) => {
                return (
                  <option value={manager} key={idx}>
                    {manager}
                  </option>
                );
              })}
            </Form.Select>
          </InputGroup>

          <InputGroup className="mb-3">
            <InputGroup.Text>강의시작일</InputGroup.Text>
            <Form.Control
              type="date"
              value={lecture["startday"]}
              onChange={(e) => {
                const newlecture = {...lecture};
                newlecture["startday"] = e.target.value;
                if (newlecture["lectureName"] !== "" && newlecture["manager"] !== "" && newlecture["startday"] !== "") {
                  newlecture["lectureID"] =
                    newlecture["lectureName"] +
                    "_" +
                    newlecture["manager"] +
                    "_" +
                    newlecture["startday"].slice(2, 4) +
                    newlecture["startday"].slice(5, 7) +
                    newlecture["startday"].slice(8, 10);
                }
                setlecture(newlecture);
              }}
            />
          </InputGroup>

          <Button
          className="btn-edit"
            variant="secondary"
            onClick={() => {
              // console.log("sbl on button click: "+JSON.stringify(selectedBookList));
              createNewLecture();
            }}
          >
            강의 생성
          </Button>
        </Modal.Body>
      </Modal>

      {/* 강의 수정 Modal */}
      <Modal show={reviseModal} onHide={reviseModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>강의 수정</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <InputGroup className="mb-3">
            <InputGroup.Text>강의명</InputGroup.Text>
            <Form.Control
              value={existlecture["lectureName"]}
              onChange={(e) => {
                const regExp = /[#?\/\\%]/gi;
                if (regExp.test(e.target.value)) {
                  alert("#,?,\\ /는 입력하실수 없습니다.");
                  e.target.value = e.target.value.substring(0, e.target.value.length - 1);
                  return;
                }
                const newlecture = {...existlecture};
                newlecture["lectureName"] = e.target.value;
                setexistlecture(newlecture);
              }}
            />
          </InputGroup>
          <InputGroup className="mb-3">
            <InputGroup.Text>과목</InputGroup.Text>
            <Form.Select
              value={existlecture["subject"]}
              onChange={(e) => {
                const newlecture = {...existlecture};
                newlecture["subject"] = e.target.value;
                setexistlecture(newlecture);
              }}
            >
              <option value="">선택</option>
              {["국어", "수학", "영어", "탐구", "기타"].map((subject, idx) => {
                return (
                  <option value={subject} key={idx}>
                    {subject}
                  </option>
                );
              })}
            </Form.Select>
          </InputGroup>
          <InputGroup className="mb-3">
            <InputGroup.Text>교재</InputGroup.Text>
            <Typeahead
              id="select_lecture_textbook"
              multiple
              onChange={(selected)=>{
                //console.log(selected);
                const newExistlecture= {...existlecture};
                //setSelectedBookList(selected);
                //console.log('sbl: '+JSON.stringify(selectedBookList));
                newExistlecture["textbookIDArray"]=selected.map((element,idx)=>{
                  return element["_id"];
                });
                console.log("new lecture: "+JSON.stringify(newExistlecture));
                setexistlecture(newExistlecture);
              }}
              options={textBookList}
              // selected={textBookList.filter((textbook,idx)=>{
              //   if(!("textbookIDArray" in existlecture))
              //     return false;
              //   if(existlecture["textbookIDArray"].includes(textbook["_id"]))
              //     return true;
              // })}
              selected={textBookList.filter((textbook,idx)=>{
                if(existlectureTextbookList.map((e)=>e["textbookID"]).includes(textbook["textbookID"]))
                  return true;
              })}
              labelKey="교재"
            />
          </InputGroup>
          <InputGroup className="mb-3">
            <InputGroup.Text>매니저(강사)</InputGroup.Text>
            <Form.Select
              value={existlecture["manager"]}
              onChange={(e) => {
                const newlecture = {...existlecture};
                newlecture["manager"] = e.target.value;
                setexistlecture(newlecture);
              }}
            >
              <option value="">선택</option>
              {managerList.map((manager, idx) => {
                return (
                  <option value={manager} key={idx}>
                    {manager}
                  </option>
                );
              })}
            </Form.Select>
          </InputGroup>

          <InputGroup className="mb-3">
            <InputGroup.Text>강의시작일</InputGroup.Text>
            <Form.Control
              type="date"
              value={existlecture["startday"]}
              onChange={(e) => {
                const newlecture = {...existlecture};
                newlecture["startday"] = e.target.value;
                setexistlecture(newlecture);
              }}
            />
          </InputGroup>

          <Button
            variant="secondary"
            onClick={() => {
              reviseLecture();
            }}
          >
            강의 수정
          </Button>
        </Modal.Body>
      </Modal>

      <div className="row m-auto lectureListBox">
        <div className="d-flex flex-row-reverse">
          <Button
            className="lectureSortingBtn"
            variant="secondary"
            onClick={() => {
              
              const newlectureList = [...lectureList];
              newlectureList.sort(function (a, b) {
                return (+(a.manager > b.manager) - 0.5) * (+!managerOn - 0.5);
              });
              setlectureList(newlectureList);
              setmanagerOn(!managerOn);
              setstartdayOn(false);
            }}
          >
            <strong>매니저순 정렬</strong>
            
          </Button>
          <Button
            className="lectureSortingBtn"
            variant="secondary"
            onClick={() => {
              const newlectureList = [...lectureList];
              newlectureList.sort(function (a, b) {
                return (+(a.startday > b.startday) - 0.5) * (+!startdayOn - 0.5);
              });
              setlectureList(newlectureList);
              setmanagerOn(false);
              setstartdayOn(!startdayOn);
            }}
          >
            <strong>강의시작일순 정렬</strong>
          </Button>
        </div>
        <Button
        variant="secondary"
        className="btn-add w-100 mb-2"
        onClick={() => {
          //console.log(groupedlectureList);
          //this can be problematic
          setTextBookNeedFlag(true);
          modalOpen();
        }}
      >
        <strong>+</strong>
      </Button>
        <Table bordered>
            <thead>
              <tr>
              <th width="10%">
                <strong>매니저</strong>
              </th>
              <th width="90%">
                <strong>강의 리스트</strong>
              </th>
            </tr>
            </thead>
            <tbody>
          {
          Object.keys(groupedlectureList).map((element, idx)=>{
            return(
              <tr key={idx}>
                <td>
                  <p><strong>{groupedlectureList[element][0]["manager"]}</strong></p>
                </td>
                <td>
                {groupedlectureList[element].map((lecture, i)=>{
                  return(
              <Card
                className="mt-2 m-2 lecture-card"
                key={i}
                onClick={() => {
                  history.push(`/Lecture/${lecture["lectureID"]}`);
                }}
              >
                <Card.Header><p><strong>{lecture["lectureName"]} ({attendingStudentList[lecture['_id']]?attendingStudentList[lecture['_id']]:0}명)</strong></p></Card.Header>
                <Card.Body>
                  <div className="text-start lectureCardContent">
                    <Card.Text className="lectureSubject">{lecture["subject"]}</Card.Text>
                    <div className="text-end">
                    <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      reviseModalOpen(lecture);
                      
                      setTextBookNeedFlag(true);
                    }}
                    variant="secondary"
                    className="lectureEditingBtn btn-edit me-1"
                  >
                    <strong>수정</strong>
                  </Button>
                  <Button
                    className="lectureEditingBtn btn-edit me-1"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      // deleteLecture(lecture["studentList"], lecture);
                    }}
                  >
                    <strong>교재</strong>
                  </Button>
                  <Button
                    className="lectureEditingBtn btn-cancel me-1"
                    variant="secondary"
                    onClick={(e) => {
                      // e.stopPropagation();
                      // deleteLecture(lecture["studentList"], lecture);
                    }}
                  >
                    <strong>삭제</strong>
                  </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
                  );
                })}
                </td>
              </tr>
            );
          })
        }
          </tbody>
        </Table>
      </div>
    </div>
  );
}

export default LectureList;

import { Form, Button, Card, ListGroup, Table, Modal, Row, Col } from "react-bootstrap";
import { Link, Route, Switch, useLocation, Redirect, matchPath } from "react-router-dom";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect } from "react";
import { AiOutlineHome } from "react-icons/ai";
import { VscBell, VscBellDot } from "react-icons/vsc";
import axios from "axios";
import menuarrow from "./next.png";

import StuListpage from "./routes/StuListpage";
import StudentAdd from "./routes/StudentAdd";
import TRwrite from "./routes/TRwrite";
import TRedit from "./routes/TRedit";
import StudentEdit from "./routes/StudentEdit";
import FirstPage from "./routes/FirstPage";
import SignUpPage from "./routes/SignUpPage";
import StuInfoAdd from "./routes/StuInfoAdd";
import StuInfoEdit from "./routes/StuInfoEdit";
import StudyChart from "./routes/StudyChart";
import CheckAlarms from "./routes/CheckAlarms";
import ClosemeetingWrite from "./routes/ClosemeetingWrite";
import ClosemeetingEdit from "./routes/ClosemeetingEdit";
import Todolist from "./routes/Todolist.js";
import MiddlemeetingWrite from "./routes/MiddlemeetingWrite";
import MiddlemeetingEdit from "./routes/MiddlemeetingEdit";
import Dashboard from "./routes/Dashboard.js";
import TextbookManage from "./routes/TextbookManage";
import WeeklymeetingWrite from "./routes/WeeklymeetingWrite";
import WeeklymeetingEdit from "./routes/WeeklymeetingEdit";
import Lecture from "./routes/Lecture";
import LectureList from "./routes/LectureList";
import WeeklystudyfeedbackWrite from "./routes/WeeklystudyfeedbackWrite";
import WeeklystudyfeedbackEdit from "./routes/WeeklystudyfeedbackEdit";
import ManageUser from "./routes/ManageUser";
import NotFound from "./routes/NotFound";
import TRDraft from "./routes/TRDraft";

import checkUserPermittedToAccessPath from "./routes/route_reachable_user_modes";

function App() {
  let history = useHistory();
  const now = new Date(); // 현재 시간
  const utcNow = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const koreaTimeDiff = 9 * 60 * 60 * 1000;
  const koreaNow = new Date(utcNow + koreaTimeDiff);
  const today = koreaNow.toISOString().split("T")[0];
  const thisMonday = getNextMon(koreaNow);

  const [studentList, setstudentList] = useState([]); // 학생 DB 리스트
  const [선택된index, 선택된index변경] = useState(0);

  const [trList, settrList] = useState([]); // 선택된 학생의 trList
  const [선택된TRindex, 선택된TRindex변경] = useState(0);

  const [managerList, setmanagerList] = useState([]);

  const { pathname } = useLocation();

  //login state 관련 코드
  const myInfoTemplate={
    loginStatus:false,
    username:"",
    nickname:"",
    user_mode:"guest",
  }
  const [myInfo,setMyInfo]= useState({...myInfoTemplate});
  const [myInfoLoaded,setMyInfoLoaded]=useState(false);
  
  useEffect(async()=>{
    // console.log(`path: ${window.location.pathname}`);
    if(myInfoLoaded){
      // console.log(`myinfo loaded: ${JSON.stringify(myInfoLoaded)}`);
      // console.log(`matchpath result: ${checkUserPermittedToAccessPath(window.location.pathname,myInfo.user_mode)}`);
      // console.log(`myinfo: ${JSON.stringify(myInfo)}`);
      if(!checkUserPermittedToAccessPath(window.location.pathname,myInfo.user_mode)){
        history.push("/NotFound");
      }
      else if(window.location.pathname==="/" && myInfo.user_mode!=="guest"){ // 로그인된 상태에서 사용자가 "/" path로 접근 시 기본 페이지로 이동
        // window.location.replace(getDefaultPathByUserMode(myInfo.user_mode)); // too slow
        history.push(getDefaultPathByUserMode(myInfo.user_mode));
      }
    }
  },[window.location.pathname,myInfoLoaded]);

  useEffect(async()=>{
    if(myInfoLoaded && checkManagerMode()){
      // getRequestAlarms();
      // await getRequestAlarmsCount();
    }
  },[myInfoLoaded]);

  const [newAlarmsCount,setNewAlarmsCount]=useState(0);
  async function getRequestAlarmsCount(){
    const new_alarms_count=await axios
      .get("/api/countMyNewAlarms")
      .then((res)=>{
        const data=res.data;
        if(!data.success) return 0;
        return data.ret;
      })
      .catch((err)=>{
        return 0;
      })
    // console.log(`my new alarms count: ${JSON.stringify(new_alarms_count)}`);
    setNewAlarmsCount(new_alarms_count);
  }
  function getAlarmsButtonVariant(){
    return newAlarmsCount>0?"primary":"secondary";
  }
  function getAlarmsButtonNumberString(){
    return newAlarmsCount>999?"999+":newAlarmsCount.toString();
  }
  function checkAlarmsButtonNeeded(){
    return checkManagerMode() && !checkCurrentPageIsCheckAlarmsPage();
  }

  useEffect(async()=>{
    if(myInfoLoaded && checkManagerMode()){
      // getRequestAlarms();
      await getRequestAlarmsCount();
    }
  },[myInfoLoaded,window.location.pathname]);

  useEffect(async ()=>{
    const myInfoData= await axios
      .get("/api/getMyInfo")
      .then((result)=>{
        const data=result.data;
        if(!data || !data.success) return {...myInfoTemplate};
        return data.ret;
      })
      .catch((err)=>{
        return {...myInfoTemplate};
      });
    setMyInfo(myInfoData);
    setMyInfoLoaded(true);
  },[]);



  // function getThisMon() {
  //   var paramDate = new Date();
  //   var day = paramDate.getDay();
  //   var diff = paramDate.getDate() - day + (day == 0 ? -6 : 1);
  //   paramDate = new Date(paramDate.setDate(diff));
  //   var output = paramDate.toISOString().split("T")[0];
  //   return output;
  // }

  function getNextMon(inputDate) {
    var tmpDate = new Date(inputDate);
    var day = tmpDate.getDay();
    var diff = tmpDate.getDate() - day + ((day == 0 ? 1 : 8) + 0);
    tmpDate = new Date(tmpDate.setDate(diff));
    var output = tmpDate.toISOString().split("T")[0];
    return output;
  }

  function checkAdminMode(){
    return myInfo.user_mode==="admin";
  }
  function checkManagerMode(){
    return myInfo.user_mode==="manager";
  }
  function checkStudentMode(){
    return myInfo.user_mode==="student";
  }

  const navBarMenus=[
    ["/studentList",()=>history.push("/studentList"),"학생관리"],
    [`/Weeklymeeting/Write/${thisMonday}`,() => {
      axios
        .get(`/api/Weeklymeeting/${thisMonday}`)
        .then((result) => { 
          // console.log(result);
          if (result["data"] === null) {
            history.push(`/Weeklymeeting/Write/${thisMonday}`);
          } else {
            history.push(`/Weeklymeeting/Edit/${thisMonday}`);
          }
        })
        .catch((err) => {
          console.log(err);
        })},"주간 결산"],
    [`/Closemeeting/${today}`,()=>history.push(`/Closemeeting/${today}`),"마감 회의"],
    ["/Textbook",()=>history.push("/Textbook"),"교재관리"],
    ["/Dashboard",() =>history.push("/Dashboard"),"대시보드"],
    ["/Lecture",()=>history.push("/Lecture"),"강의관리"],
    ["/ManageUser",()=> history.push("/ManageUser"),"사용자 관리"],
  ];

  function getNavBarButtonIfValid(path,onclick_callback,prompt,idx){
    if(!checkUserPermittedToAccessPath(path,myInfo.user_mode)) return false;
    return (
      <Button
        className="menu-map-btn btn-secondary"
        onClick={onclick_callback}
        key={idx}
      >
        <h5>
          <strong>{prompt}</strong>
        </h5>
      </Button>
    );
  }

  function getDefaultPathByUserMode(user_mode){
    if(user_mode==="admin" || user_mode==="manager") return "/studentList";
    else if(user_mode==="student") return "/TRDraft";
    else return "/";
  }
  function getCheckAlarmPagePath(){
    return "/CheckAlarms";
  }
  function checkCurrentPageIsCheckAlarmsPage(){
    const current_location_pathname=window.location.pathname;
    const check_alarms_page_path=getCheckAlarmPagePath();
    return current_location_pathname===check_alarms_page_path;
  }

  return (
    myInfoLoaded?
    <div className="App">
      {window.location.pathname !== "/" && window.location.pathname !== "/SignUp" ? 
      <div className="menu">
      <div className="menu-map">
        <div className="userInfoBox">
          {myInfo.loginStatus?
          <div className="userNameBox">
            <h5>{myInfo.nickname}</h5> 님 환영합니다!
            <br/>
          </div>
          :null}
          <Button
            className="logoutButton btn-secondary"
            onClick={async ()=>{
              if(window.confirm('로그아웃 하시겠습니까?')){
                await axios
                  .post("/api/logout",{})
                  .then((result)=>{
                    setMyInfo({...myInfoTemplate});
                    return history.push("/");
                  })
                  .catch((err)=>{
                    window.alert("로그아웃에 실패했습니다\n다시 시도해주세요");
                    console.log(`logout fail: ${err}`);
                  });
              }
            }}
          >
            로그아웃
          </Button>
        </div>
        {/* <Button
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
              axios
                .get(`/api/Weeklymeeting/${thisMonday}`)
                .then((result) => { 
                  // console.log(result);
                  if (result["data"] === null) {
                    history.push(`/Weeklymeeting/Write/${thisMonday}`);
                  } else {
                    history.push(`/Weeklymeeting/Edit/${thisMonday}`);
                  }
                })
                .catch((err) => {
                  console.log(err);
                });
            }}
                        >
            <h5>
              <strong>주간 결산</strong>
            </h5>
          </Button>

        <Button
          className="menu-map-btn btn-secondary"
          onClick={() => {
            // axios
            //   .get(`/api/Closemeeting/${today}`)
            //   .then((result) => {
            //     if (result["data"] === null) {
            //       history.push(`/Closemeeting/Write/${today}`);
            //     } else {
            //       history.push(`/Closemeeting/Edit/${today}`);
            //     }
            //   })
            //   .catch((err) => {
            //     console.log(err);
            //   });
            history.push(`/Closemeeting/${today}`)
          }}
        >
          <h5>
            <strong>마감 회의</strong>
          </h5>
        </Button>
        <Button
          className="menu-map-btn btn-secondary"
          onClick={() => {
            history.push("/Textbook");
          }}
        >
          <h5>
            <strong>교재관리</strong>
          </h5>
        </Button>
        <Button
          className="menu-map-btn btn-secondary"
          onClick={() => {
            history.push("/Dashboard");
          }}
        >
          <h5>
            <strong>대시보드</strong>
          </h5>
        </Button>
        <Button
          className="menu-map-btn btn-secondary"
          onClick={() => {
            history.push("/Lecture");
          }}
        >
          <h5>
            <strong>강의관리</strong>
          </h5>
        </Button>
        {checkAdminMode()?
          <Button
            className="menu-map-btn btn-secondary"
            onClick={() => {
              history.push("/ManageUser");
            }}
          >
            <h5>
              <strong>사용자 관리</strong>
            </h5>
          </Button>:null} */}
          {navBarMenus.map((menu_data,idx)=>getNavBarButtonIfValid(menu_data[0],menu_data[1],menu_data[2],idx))}
      </div>
      <div className="menuArrow">
        <img src={menuarrow} alt="menuarrow" />
      </div>
    </div>
    : null
      }
      {window.location.pathname!=="/"?
        <div className="UtilButtonBox">
          {checkAlarmsButtonNeeded()?
            <Button
              variant={getAlarmsButtonVariant()}
              className="alarmsButton"
              onClick={()=>{
                const default_path_for_this_user_mode=getDefaultPathByUserMode(myInfo.user_mode);
                const current_location_pathname=window.location.pathname;
                const check_alarms_page_path=getCheckAlarmPagePath();
                if(current_location_pathname!==default_path_for_this_user_mode &&
                  !window.confirm("알람 확인 페이지로 이동하면\n현재 페이지에서 입력 중인 정보가 저장되지 않습니다\n이동하시겠습니까?")) return;
                history.push(check_alarms_page_path);
              }}
            >
              <VscBell/>
              <div
                className="AlarmsCountBox text-sm"
              >
                <label>
                  {getAlarmsButtonNumberString()}
                </label>
              </div>
            </Button>:null
          }
          <Button
            variant="secondary"
            onClick={()=>{
              const default_path_for_this_user_mode=getDefaultPathByUserMode(myInfo.user_mode);
              const current_location_pathname=window.location.pathname;
              if(current_location_pathname==default_path_for_this_user_mode) return;
              else if(window.location.pathname==="/SignUp" && !window.confirm("홈으로 이동하면 입력된 정보가 모두 사라집니다.\n이동하시겠습니까?")) return;
              history.push(default_path_for_this_user_mode);
            }}
          >
            <AiOutlineHome/>
          </Button>
        </div>:null
      }
      
      
      <Switch>
        <Route exact path="/">
          <FirstPage/>
        </Route>
        <Route exact path="/SignUp">
          <SignUpPage />
        </Route>
        <Route exact path="/studentList">
          <StuListpage />
        </Route>
        <Route exact path="/studentAdd">
          <StudentAdd />
        </Route>
        <Route exact path="/StudentEdit/:ID">
          <StudentEdit />
        </Route>
        <Route exact path="/TR/:ID/write">
          <TRwrite />
        </Route>
        <Route exact path="/TR/:ID/edit/:date">
          <TRedit />
        </Route>
        <Route exact path="/StuInfoAdd">
          <StuInfoAdd />
        </Route>

        <Route exact path="/StuInfoEdit/:ID">
          <StuInfoEdit />
        </Route>
        <Route exact path="/Chart/:ID">
          <StudyChart />
        </Route>
        {/* <Route exact path="/Closemeeting/Write/:date">
          <ClosemeetingWrite />
        </Route> */}

        {/* <Route exact path="/Closemeeting/Edit/:date">
          <ClosemeetingEdit />
        </Route> */}
        <Route exact path="/Closemeeting/:date">
          <ClosemeetingEdit />
        </Route>
        <Route exact path="/Middlemeeting/Write/:date">
          <MiddlemeetingWrite />
        </Route>
        <Route exact path="/Middlemeeting/Edit/:date">
          <MiddlemeetingEdit />
        </Route>
        <Route exact path="/Todolist">
          <Todolist />
        </Route>
        <Route exact path="/Dashboard">
          <Dashboard />
        </Route>
        <Route exact path="/Textbook">
          <TextbookManage />
        </Route>
        <Route exact path="/Weeklymeeting/Write/:thisMonday">
          <WeeklymeetingWrite />
          </Route>
          <Route exact path="/Weeklymeeting/Edit/:thisMonday">
          <WeeklymeetingEdit />
          </Route>
        <Route exact path="/Lecture">
          <LectureList />
        </Route>
        <Route exact path="/Lecture/:lectureID">
          <Lecture />
        </Route>
        <Route exact path="/WeeklystudyfeedbackWrite/:ID/:feedbackDate">
          <WeeklystudyfeedbackWrite />
        </Route>
        <Route exact path="/WeeklystudyfeedbackEdit/:ID/:feedbackDate">
          <WeeklystudyfeedbackEdit />
          </Route>
        <Route exact path="/ManageUser">
          <ManageUser/>
        </Route>
        <Route exact path="/TRDraft">
          <TRDraft/>
        </Route>
        <Route exact path="/CheckAlarms">
          <CheckAlarms/>
        </Route>
        <Route exact path="/NotFound">
          <NotFound/>
        </Route>
        <Route path="*">
          <NotFound/>
        </Route>
      </Switch>
    </div>
  :null);
}

export default App;
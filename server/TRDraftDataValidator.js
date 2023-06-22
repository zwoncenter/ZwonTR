const request_type_name_to_index={
    "lifeData":0,
    "AssignmentStudyData":1,
    "LectureAndTextbookStudyData":2,
    "ProgramParticipationData":3,
}
const index_to_request_type_name={
    0:"lifeData",
    1:"AssignmentStudyData",
    2:"LectureAndTextbookStudyData",
    3:"ProgramParticipationData",
};
const request_status_to_index={
    "created":0,
    "review_needed":1,
    "confirmed":2,
    "expired":3,
};
const review_status_to_index={
    "not_reviewed":0,
    "accepted":1,
    "declined":2,
    "passed":3,
};
const index_to_review_status={
    0:"not_reviewed",
    1:"accepted",
    2:"declined",
    3:"passed"
};
const written_to_TR_status_to_index={
    "not_written":0,
    "written":1,
    "passed":2
};
const index_to_written_to_TR_status={
    0:"not_written",
    1:"written",
    2:"passed"
};
const request_document_on_insert_template={
    student_id:null,
    date:null,
    request_type:null,
};
const life_data_request_document_on_update_template={
    modify_date:null,
    request_status:0,
    "request_specific_data.신체컨디션":null,
    "request_specific_data.정서컨디션":null,
    "request_specific_data.실제취침":null,
    "request_specific_data.실제기상":null,
    deleted:false,
    written_to_TR:0,
};
const assignment_study_data_request_document_on_update_template={
    modify_date:null,
    request_status:0,
    deleted:false,
    written_to_TR:0,
};
const request_study_data_template={
    excuse:null,
    time_amount:null,
    finished_state:true,
    review_id:null,
    timestamp:null,
};
const request_review_document_template={
    tr_draft_request_id:null,
    study_data_review_id:null,
    review_from:null,
    review_status:null,
    review_msg:null,
    modify_date:null,
    create_date:null,
    forwarded_from:null,
};
const TR_draft_request_on_review_update_template={
    request_status:request_status_to_index["created"],
    modify_date:null,
}
const request_reivew_on_update_template={
    review_status:review_status_to_index["not_reviewed"],
    review_msg:null,
    modify_date:null,
};
const DGCL_filter_template={ // daily goal check log filter template
    date:null,
    studentID:null,
    AOSID:null,
    textbookID:null,
}
const DGCL_on_insert_template={ // daily goal check log insert template
    AOSID:null,
    date:null,
    studentID:null,
    studentName:null,
    textbookID:null,
    AOSTextbookID:null,
    description:null,
};
const DGCL_on_update_push_template={ // daily goal check log update template
    excuseList:null,
    finishedStateList:null,
};
const duplicatable_name_list=["모의고사","테스트","기타"];
const duplicatable_subject_list=["국어","수학","영어","탐구","기타"];
const daily_active_LAT_request_max_count=50;
const daily_LAT_request_max_count=500;
const program_name_list=["자기인식","진로탐색","헬스","외부활동","독서","외국어"];
const program_description_min_len=10;
const program_description_max_len=500;
const daily_active_program_request_max_count=50;
const daily_program_request_max_count=500;

const reviewer_array_max_len=20;

const review_msg_min_len=10;
const review_msg_max_len=200;

function intBetween(a,left,right){
    return a>=left && a<=right;
}
function checkTimeStringValid(time_string){
    if(typeof time_string!=="string") return false;
    const string_splitted=time_string.split(":");
    if(string_splitted.length!==2) return false;
    else if(!intBetween(string_splitted[0].length,1,2) || !intBetween(string_splitted[1].length,1,2)) return false;
    else if(Number.isNaN(parseInt(string_splitted[0])) || Number.isNaN(parseInt(string_splitted[1]))) return false;
    else return true;
}
function checkConditionValueValid(condition_val){
    const parsed=parseInt(condition_val);
    if(Number.isNaN(parsed)) return false;
    else return intBetween(parsed,1,5)
}
function checkLifeDataValid(bodyCondition,sentimentCondition,goToBedTime,wakeUpTime,comeToCenterTime){
    return checkConditionValueValid(bodyCondition) && checkConditionValueValid(sentimentCondition)
        && checkTimeStringValid(goToBedTime) && checkTimeStringValid(wakeUpTime)
        && checkTimeStringValid(comeToCenterTime);
}
function getStudyDataElement(excuse,timeAmount,finishedState,reviewID,timestamp){
    const ret={...request_study_data_template};
    ret.excuse=excuse;
    ret.time_amount=timeAmount;
    ret.finished_state=finishedState;
    ret.review_id=reviewID;
    ret.timestamp=timestamp;
    return ret;
}
function getLifeDataRequestOnInsertSettings(student_id,today_string){
    const ret={...request_document_on_insert_template};
    ret["student_id"]=student_id;
    ret["date"]=today_string;
    ret["request_type"]=request_type_name_to_index["lifeData"];
    return ret;
}
function getLifeDataRequestOnUpdateSettings(requestStatus,bodyCondition,sentimentCondition,goToBedTime,wakeUpTime,comeToCenterTime,currentDate,_id=null,writtenToTR=written_to_TR_status_to_index["not_written"]){
    const ret={...life_data_request_document_on_update_template};
    ret["request_status"]=requestStatus;
    ret["request_specific_data.신체컨디션"]=bodyCondition;
    ret["request_specific_data.정서컨디션"]=sentimentCondition;
    ret["request_specific_data.실제취침"]=goToBedTime;
    ret["request_specific_data.실제기상"]=wakeUpTime;
    ret["request_specific_data.실제등원"]=comeToCenterTime;
    ret["modify_date"]=currentDate;
    ret["written_to_TR"]=writtenToTR;
    if(_id) ret._id=_id;
    return ret;
}
function checkExcuseValueValid(excuse_val,finishedState){
    return (typeof excuse_val === "string") && ((finishedState===true && excuse_val.length===0) || (finishedState===false && intBetween(excuse_val.length,15,200)));
}
function checkRequestDataUpdatable(request_status){
    return request_status===request_status_to_index["created"];
}
function getAssignmentStudyDataRequestOnInsertSettings(student_id,today_string,AOSID){
    const ret={...request_document_on_insert_template};
    ret["student_id"]=student_id;
    ret["date"]=today_string;
    ret["request_type"]=request_type_name_to_index["AssignmentStudyData"];
    // request_doc["request_specific_data"]={AOSID};
    ret["request_specific_data.AOSID"]=AOSID;
    return ret;
}
function getAssignmentStudyDataRequestOnUpdateSettings(requestStatus,currentDate,_id=null,writtenToTR=written_to_TR_status_to_index["not_written"]){
    const ret={...assignment_study_data_request_document_on_update_template};
    ret.request_status=requestStatus;
    ret.modify_date=currentDate;
    ret.written_to_TR=writtenToTR;
    if(_id) ret._id=_id;
    return ret;
}
function getLATStudyDataRequestOnInsertSettings(student_id,today_string,textbookID,elementID,_id=null){
    const ret={...request_document_on_insert_template};
    ret["student_id"]=student_id;
    ret["date"]=today_string;
    ret["request_type"]=request_type_name_to_index["LectureAndTextbookStudyData"];
    ret["request_specific_data.textbookID"]=textbookID;
    ret["request_specific_data.elementID"]=elementID;
    if(_id) ret._id=_id;
    return ret;
}
function getLATStudyDataRequestOnUpdateSettings(requestStatus,currentDate,deleted=false,duplicatable=true,duplicatableName="",duplicatableSubject="",recentPage=0,writtenToTR=written_to_TR_status_to_index["not_written"]){
    const ret={...assignment_study_data_request_document_on_update_template};
    ret.request_status=requestStatus;
    ret.modify_date=currentDate;
    ret.deleted=deleted;
    ret["request_specific_data.duplicatable"]=duplicatable;
    ret["request_specific_data.duplicatable_name"]=duplicatableName;
    ret["request_specific_data.duplicatable_subject"]=duplicatableSubject;
    ret["request_specific_data.recent_page"]=recentPage;
    ret["written_to_TR"]=writtenToTR;
    return ret;
}
function checkDuplicatableNameValid(duplicatableName){
    for(let i=0; i<duplicatable_name_list.length; i++){
        if(duplicatableName===duplicatable_name_list[i]) return true;
    }
    return false;
}
function checkDuplicatableSubjectValid(duplicatableSubject){
    for(let i=0; i<duplicatable_subject_list.length; i++){
        if(duplicatableSubject===duplicatable_subject_list[i]) return true;
    }
    return false;
}
function checkRecentPageValid(recentPageString){
    if(typeof recentPageString !=="string" || !intBetween(recentPageString.length,1,5)) return false;
    return !isNaN(parseInt(recentPageString)) || parseInt(recentPageString)<0;
}
function getProgramDataRequestOnInsertSettings(student_id,today_string,elementID,_id=null){
    const ret={...request_document_on_insert_template};
    ret["student_id"]=student_id;
    ret["date"]=today_string;
    ret["request_type"]=request_type_name_to_index["ProgramParticipationData"];
    ret["request_specific_data.elementID"]=elementID;
    if(_id) ret._id=_id;
    return ret;
}
function getProgramDataRequestOnUpdateSettings(requestStatus,currentDate,deleted=false,programName="",programBy=null,programDescription="",writtenToTR=written_to_TR_status_to_index["not_written"]){
    const ret={...assignment_study_data_request_document_on_update_template};
    ret.request_status=requestStatus;
    ret.modify_date=currentDate;
    ret.deleted=deleted;
    ret["request_specific_data.program_name"]=programName;
    ret["request_specific_data.program_by"]=programBy;
    ret["request_specific_data.program_description"]=programDescription;
    ret["written_to_TR"]=writtenToTR
    return ret;
}
function checkProgramNameValid(programName){
    for(let i=0; i<program_name_list.length; i++){
        if(programName===program_name_list[i]) return true;
    }
    return false;
}
//return ObjectId of user if exists, else false if not
function checkProgramByValid(programBy,program_manager_list){
    for(let i=0; i<program_manager_list.length; i++){
        const program_leader=program_manager_list[i];
        if(programBy===program_leader.username) return program_leader._id;
    }
    return false;
}
function checkProgramByUsernameValid(programBy_username){
    return typeof programBy_username==="string";
}
function checkProgramDescriptionValid(programDescription){
    if(typeof programDescription !=="string") return false;
    return intBetween(programDescription.length,program_description_min_len,program_description_max_len);
}
function checkReviewerUsernameValid(reviewer_username){
    return typeof reviewer_username==="string";
}
function checkReviewerUsernameArrayValid(reviewer_array){
    if(!Array.isArray(reviewer_array) || reviewer_array.length>reviewer_array_max_len) return false;
    for(let i=0; i<reviewer_array.length; i++){
        const reviewer_username=reviewer_array[i];
        if(!checkReviewerUsernameValid(reviewer_username)) return false;
    }
    return true;
}
function getNewRequestReviewDocument(requestOid,studyDataReviewOid,reviewFromOid,currentDate){
    const ret={...request_review_document_template};
    ret.tr_draft_request_id=requestOid;
    ret.study_data_review_id=studyDataReviewOid;
    ret.review_from=reviewFromOid;
    ret.create_date=currentDate;
    ret.review_status=review_status_to_index["not_reviewed"];
    return ret;
}
function getNewRequestReviewListByUserDocumentList(requestOid,studyDataReviewOid,userDocumentList,currentDate){
    return userDocumentList.map((user_doc,idx)=>{
        const user_id=user_doc._id;
        const new_review_doc=getNewRequestReviewDocument(requestOid,studyDataReviewOid,user_id,currentDate);
        return new_review_doc;
    });
}
function checkReviewStatusValid(reviewStatus){
    if(typeof reviewStatus!=="number") return false;
    return reviewStatus===review_status_to_index["accepted"] || reviewStatus===review_status_to_index["declined"];
}
function checkReviewMsgValid(reviewStatus,reviewMsg){
    if(typeof reviewMsg !== "string") return false;
    else if(reviewStatus===review_status_to_index["accepted"] && reviewMsg.length===0) return true;
    else if(reviewStatus===review_status_to_index["declined"] && intBetween(reviewMsg.length,review_msg_min_len,review_msg_max_len)) return true;
    else return false;
}
function getTDRROnUpdateSettings(reviewStatus,reviewMsg,modifyDate){
    const ret={...request_reivew_on_update_template};
    ret.review_status=reviewStatus;
    ret.review_msg=reviewMsg;
    ret.modify_date=modifyDate;
    return ret;
}
function getTRDraftOnReviewUpdateSettings(reviewStatus,modifyDate){
    const ret={...TR_draft_request_on_review_update_template};
    if(reviewStatus===review_status_to_index["accepted"]) ret.request_status=request_status_to_index["confirmed"];
    else if(reviewStatus===review_status_to_index["declined"]) ret.request_status=request_status_to_index["created"];
    ret.modify_date=modifyDate;
    return ret;
}
function checkRequestTypeNeedDGCLUpdate(requestType,request_specific_data){
    const element_duplicatable=request_specific_data.duplicatable;
    return requestType===request_type_name_to_index["AssignmentStudyData"] || 
        (requestType===request_type_name_to_index["LectureAndTextbookStudyData"] && !element_duplicatable);
}
function getDGCLOnInsertSettings(date,studentID,studentName,AOSID,textbookID,AOSTextbookID,description=""){
    const ret={...DGCL_on_insert_template};
    ret.date=date;
    ret.studentID=studentID;
    ret.studentName=studentName;
    ret.AOSID=AOSID;
    ret.textbookID=textbookID;
    ret.AOSTextbookID=AOSTextbookID;
    ret.description=description;
    return ret;
}
function getDGCLOnUpdatePushSettings(finishedState,excuse){
    const ret={...DGCL_on_update_push_template};
    ret.finishedStateList=finishedState
    ret.excuseList=finishedState?"":excuse;
    return ret;
}
function getDGCLFilter(date,studentID,AOSID,textbookID){
    const ret={...DGCL_filter_template};
    ret.date=date;
    ret.studentID=studentID;
    ret.AOSID=AOSID;
    ret.textbookID=textbookID;
    return ret;
}
function getDGCLBulkWriteUpdateOneSettings(filter,setOnInsertSettings,pushSettings){
    const ret= {
        updateOne:{
            filter,
            update:{
                $setOnInsert:setOnInsertSettings,
                $push:pushSettings,
            },
            upsert:true,
        }
    };
    return ret;
}
function getDGCLBulkWriteUpsertDocsFromTDRDocs(TDRDocs,studentName,description=""){
    return TDRDocs.map((doc,idx)=>{
        const date=doc.date;
        const student_id=doc.student_id;
        const AOSID=doc.request_type===request_type_name_to_index["AssignmentStudyData"]?doc.request_specific_data.AOSID:"";
        const AOSTextbookID=doc.AOSTextbookID;
        const textbookID=doc.request_type===request_type_name_to_index["LectureAndTextbookStudyData"]?doc.request_specific_data.textbookID:"";
        const finished_state=doc.study_data.finished_state;
        const excuse=doc.study_data.excuse;
        const filter=getDGCLFilter(date,student_id,AOSID,textbookID);
        const set_on_insert_settings=getDGCLOnInsertSettings(date,student_id,studentName,AOSID,textbookID,AOSTextbookID,description);
        const push_settings=getDGCLOnUpdatePushSettings(finished_state,excuse);
        return getDGCLBulkWriteUpdateOneSettings(filter,set_on_insert_settings,push_settings);
    });
}
function checkTRDraftRequestReviwerReassignValid(requestReviewStatus,requestReviewerUserID,requestReviewerUserArray){
    const ret={
        valid:false,
        error_msg:"",
        page_reload:false,
    }
    if(requestReviewStatus!==review_status_to_index["not_reviewed"]){
        ret.error_msg="이미 리뷰가 작성된 항목이므로 리뷰어를 재지정할 수 없습니다";
        ret.page_reload=true;
    }
    else if(requestReviewerUserID.equals(requestReviewerUserArray[0]._id)){
        ret.error_msg="이전 리뷰어와 동일한 리뷰어를 재지정하였습니다";
    }
    else{
        ret.valid=true;
    }
    return ret;
}
module.exports={
    request_document_on_insert_template,
    life_data_request_document_on_update_template,
    request_status_to_index,
    review_status_to_index,
    index_to_review_status,
    index_to_request_type_name,
    written_to_TR_status_to_index,
    index_to_written_to_TR_status,
    request_study_data_template,
    request_review_document_template,
    request_type_name_to_index,
    daily_active_LAT_request_max_count,
    daily_LAT_request_max_count,
    daily_active_program_request_max_count,
    daily_program_request_max_count,
    intBetween,
    checkTimeStringValid,
    checkConditionValueValid,
    checkLifeDataValid,
    getStudyDataElement,
    getLifeDataRequestOnInsertSettings,
    getLifeDataRequestOnUpdateSettings,
    checkExcuseValueValid,
    getAssignmentStudyDataRequestOnInsertSettings,
    getAssignmentStudyDataRequestOnUpdateSettings,
    getLATStudyDataRequestOnInsertSettings,
    getLATStudyDataRequestOnUpdateSettings,
    checkRequestDataUpdatable,
    checkDuplicatableNameValid,
    checkDuplicatableSubjectValid,
    checkRecentPageValid,
    getProgramDataRequestOnInsertSettings,
    getProgramDataRequestOnUpdateSettings,
    // getNewProgramDataRequestDocument,
    checkProgramNameValid,
    checkProgramByUsernameValid,
    checkProgramByValid,
    checkProgramDescriptionValid,
    checkReviewerUsernameArrayValid,
    getNewRequestReviewDocument,
    getNewRequestReviewListByUserDocumentList,
    checkReviewStatusValid,
    checkReviewMsgValid,
    checkRequestTypeNeedDGCLUpdate,
    getTRDraftOnReviewUpdateSettings,
    getTDRROnUpdateSettings,
    getDGCLOnInsertSettings,
    getDGCLOnUpdatePushSettings,
    getDGCLBulkWriteUpdateOneSettings,
    getDGCLBulkWriteUpsertDocsFromTDRDocs,
    checkTRDraftRequestReviwerReassignValid,
}
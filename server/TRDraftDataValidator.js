const request_type_name_to_index={
    "lifeData":0,
    "AssignmentStudyData":1,
    "LectureAndTextbookStudyData":2,
    "ProgramParticipationData":3,
}
const request_status_to_index={
    "created":0,
    "review_needed":1,
    "confirmed":2,
};
const request_document_template={
    student_id:null,
    date:null,
    modify_date:null,
    request_status:0,
    request_type:null,
    request_specific_data:null,
    study_data_list:null,
    deleted:false,
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
    review_msg:null,
    modify_date:null,
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
function checkLifeDataValid(bodyCondition,sentimentCondition,goToBedTime,wakeUpTime){
    return checkConditionValueValid(bodyCondition) && checkConditionValueValid(sentimentCondition)
        && checkTimeStringValid(goToBedTime) && checkTimeStringValid(wakeUpTime);
}
function getNewLifeDataRequestDocument(student_id,today_string){
    const request_doc={...request_document_template};
    request_doc["student_id"]=student_id
    request_doc["date"]=today_string;
    request_doc["request_status"]=0;
    request_doc["request_type"]=request_type_name_to_index["lifeData"];
    // request_doc["request_specific_data"]={};
    delete request_doc["request_specific_data"];
    // request_doc["study_data_list"]=[];
    delete request_doc["study_data_list"];
    return request_doc;
}
function checkExcuseValueValid(excuse_val,finishedState){
    return (typeof excuse_val === "string") && ((finishedState===true && excuse_val.length===0) || (finishedState===false && intBetween(excuse_val.length,15,200)));
}
function checkRequestDataUpdatable(request_status){
    return request_status===request_status_to_index["created"];
}
function getNewAssignmentStudyDataRequestDocument(student_id,today_string,AOSID){
    const request_doc={...request_document_template};
    request_doc["student_id"]=student_id
    request_doc["date"]=today_string;
    request_doc["request_status"]=0;
    request_doc["request_type"]=request_type_name_to_index["AssignmentStudyData"];
    // request_doc["request_specific_data"]={AOSID};
    delete request_doc["request_specific_data"];
    request_doc["request_specific_data.AOSID"]=AOSID;
    delete request_doc["study_data_list"];
    return request_doc;
}
function getNewLATStudyDataRequestDocument(student_id,today_string,textbookID,elementID,duplicatableName="",duplicatableSubject="",recentPage=0){
    const request_doc={...request_document_template};
    request_doc["student_id"]=student_id;
    request_doc["date"]=today_string;
    request_doc["request_status"]=0;
    request_doc["request_type"]=request_type_name_to_index["LectureAndTextbookStudyData"];
    // request_doc["request_specific_data"]={
    //     textbookID,
    //     elementID,
    //     deleted:false,
    //     duplicatable:textbookID?false:true,
    //     duplicatable_name:duplicatableName,
    //     duplicatable_subject:duplicatableSubject,
    //     recent_page:recentPage,
    // };
    delete request_doc["request_specific_data"];
    request_doc["request_specific_data.textbookID"]=textbookID;
    request_doc["request_specific_data.elementID"]=elementID;
    // request_doc["request_specific_data.deleted"]=false;
    request_doc["deleted"]=false;
    request_doc["request_specific_data.duplicatable"]=textbookID?false:true;
    request_doc["request_specific_data.duplicatable_name"]=duplicatableName;
    request_doc["request_specific_data.duplicatable_subject"]=duplicatableSubject;
    request_doc["request_specific_data.recent_page"]=recentPage;
    delete request_doc["study_data_list"];
    return request_doc;
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
function getNewProgramDataRequestDocument(student_id,today_string,elementID,programName="",programBy="",programDescription=""){
    const request_doc={...request_document_template};
    request_doc["student_id"]=student_id;
    request_doc["date"]=today_string;
    request_doc["request_status"]=0;
    request_doc["request_type"]=request_type_name_to_index["ProgramParticipationData"];
    delete request_doc["request_specific_data"];
    request_doc["request_specific_data.elementID"]=elementID;
    // request_doc["request_specific_data.deleted"]=false;
    request_doc["deleted"]=false;
    request_doc["request_specific_data.program_name"]=programName;
    request_doc["request_specific_data.program_by"]=programBy;
    request_doc["request_specific_data.program_description"]=programDescription;
    delete request_doc["study_data_list"];
    return request_doc;
}
function checkProgramNameValid(programName){
    for(let i=0; i<program_name_list.length; i++){
        if(programName===program_name_list[i]) return true;
    }
    return false;
}
function checkProgramByValid(programBy,program_manager_list){
    for(let i=0; i<program_manager_list.length; i++){
        if(programBy===program_manager_list[i]) return true;
    }
    return false;
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
function getNewRequestReviewDocument(requestOid,studyDataReviewOid,reviewFromOid){
    const ret={...request_review_document_template};
    ret.tr_draft_request_id=requestOid;
    ret.study_data_review_id=studyDataReviewOid;
    ret.review_from=reviewFromOid;
    return ret;
}
function getNewRequestReviewListByUserDocumentList(requestOid,studyDataReviewOid,userDocumentList){
    return userDocumentList.map((user_doc,idx)=>{
        const user_id=user_doc._id;
        const new_review_doc=getNewRequestReviewDocument(requestOid,studyDataReviewOid,user_id);
        return new_review_doc;
    });
}
module.exports={
    request_document_template,
    request_status_to_index,
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
    getNewLifeDataRequestDocument,
    checkExcuseValueValid,
    getNewAssignmentStudyDataRequestDocument,
    getNewLATStudyDataRequestDocument,
    checkRequestDataUpdatable,
    checkDuplicatableNameValid,
    checkDuplicatableSubjectValid,
    checkRecentPageValid,
    getNewProgramDataRequestDocument,
    checkProgramNameValid,
    checkProgramByValid,
    checkProgramDescriptionValid,
    checkReviewerUsernameArrayValid,
    getNewRequestReviewDocument,
    getNewRequestReviewListByUserDocumentList,
}
const moment = require('moment');
function isUsernameValid(username){
    if(!(typeof username === "string")) return false;
    const matched=username.match(/[a-z\d]{5,20}/);
    if(matched){
        return username.length===matched[0].length;
    }
    else return false;
}
function isPasswordValid(password){
    if(!(typeof password === "string")) return false;
    const matched=password.match(/^(?=.*[a-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,16}$/);
    if(matched){
        return password.length===matched[0].length;
    }
    else return false;
}
function isNicknameValid(nickname){
    if(!(typeof nickname === "string")) return false;
    const matched=nickname.match(/[가-힣]{2,10}/);
    if(matched){
        return nickname.length===matched[0].length;
    }
    else return false;
}
function isDateStringValid(date_string){
    if(!(typeof date_string ==='string')) return false;
    return moment(date_string).isValid();
}
function isBirthDateValid(birth_date_string){
    return isDateStringValid(birth_date_string);
}
function isGenderValid(gender){
    if(!(typeof gender === "string")) return false;
    return gender==="남자" || gender==="여자";
}
function isPhoneNumberValid(phone_number){
    if(!(typeof phone_number === "string")) return false;
    const matched=phone_number.match(/[\d]{11}/);
    if(matched){
        return phone_number.length===matched[0].length && phone_number.slice(0,3)==="010";
    }
    else return false;
}
function isEmailValid(email){
    if(!(typeof email === "string")) return false;
    const matched=email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/);
    if(matched){
        return email.length==matched[0].length;
    }
    else return false;
}
function isAddressValid(address){
    if(!(typeof address === "string")) return false;
    return address.length>10;
}
const schools=[
    "대학교","고등학교","중학교","초등학교"
];
function getAttendingStatusesBySchoolType(school_type){
    if(school_type==="대학교") return ["졸업","졸업예정","재학","휴학","중퇴"];
    else if(school_type==="고등학교") return ["졸업(검정고시 포함)","재학","중퇴"];
    else if(school_type==="중학교") return ["졸업(검정고시 포함)","재학","중퇴"];
    else return ["졸업","재학"];
}
function isSchoolAttendingStatusValid(schoolType,attendingStatus){
    if(typeof schoolType!=="string" || typeof attendingStatus!=="string") return false;
    let attending_status_candidates=null;
    for(let i=0; i<schools.length; i++){
        if(schoolType===schools[i]){
            attending_status_candidates=getAttendingStatusesBySchoolType(schoolType);
            break;
        }
    }
    if(!attending_status_candidates) return false;
    for(let i=0; i<attending_status_candidates.length; i++){
        if(attendingStatus === attending_status_candidates[i]) return true;
    }
    return false;
}
function MajorInfoNeeded(user_type,school_attending_info_school){
    return user_type==="manager" && school_attending_info_school==="대학교";
}
const departments=[
    "인문계열",
    "사회계열(경상계열)",
    "사회계열(법학계열)",
    "사회계열(사회과학계열)",
    "교육계열",
    "공학계열",
    "자연계열",
    "의약계열(의학)",
    "의약계열(약학)",
    "의약계열(간호, 치료보건)",
    "예체능계열",
    "기타",
];
function isDepartmentValid(department){
    for(let i=0; i<departments.length; i++){
        if(department===departments[i]) return true;
    }
    return false;
}
function isMajorValid(major){
    if(!(typeof major === "string")) return false;
    return major.length>2;
}
function groupOfUserNeeded(userRoleName){
    if(typeof userRoleName!=="string") return false;
    return userRoleName==="student" || userRoleName==="manager";
}
module.exports={
    isUsernameValid,
    isPasswordValid,
    isNicknameValid,
    isDateStringValid,
    isBirthDateValid,
    isGenderValid,
    isPhoneNumberValid,
    isEmailValid,
    isAddressValid,
    isSchoolAttendingStatusValid,
    MajorInfoNeeded,
    isDepartmentValid,
    isMajorValid,
    groupOfUserNeeded,
};
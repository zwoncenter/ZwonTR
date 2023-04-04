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
    const matched=password.match(/^(?=.*[a-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,10}$/);
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
function MajorInfoNeeded(user_type,school_attending_info_school){
    return user_type==="manager" && school_attending_info_school==="대학교";
}
function isMajorValid(major){
    if(!(typeof major === "string")) return false;
    return major.length>2;
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
    MajorInfoNeeded,
    isMajorValid,
};
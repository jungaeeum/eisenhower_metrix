const userDao = require("../dao/userDao");
const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../../secret");

exports.signup = async function (req, res) {
  const { email, password, nickname } = req.body;

  if (!email || !password || !nickname) {
    return res.send({
      isSuccess: false,
      code: 400,
      message: "회원가입 입력값을 확인해주세요.",
    });
  }

  const isValidEmail =
    /^[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i;

  if (!isValidEmail.test(email)) {
    return res.send({
      isSuccess: false,
      code: 400,
      message: "이메일 형식을 확인해주세요.",
    });
  }

  const isValidPassword = /^(?=.*\d)(?=.*[a-zA-Z])[0-9a-zA-Z]{8,20}$/;
  if (!isValidPassword.test(password)) {
    return res.send({
      isSuccess: false,
      code: 400,
      message: "비밀번호 형식을 확인해주세요.",
    });
  }

  if (nickname.length < 2 || nickname.length > 10) {
    return res.send({
      isSuccess: false,
      code: 400,
      message: "닉네임 형식을 확인해주세요. 2-10글자",
    });
  }

  //중복 회원 검사
  const isDuplicatedEmail = await userDao.selectUserByEmail(email);

  if (isDuplicatedEmail.length > 0) {
    return res.send({
      isSuccess: false,
      code: 400,
      message: "이미 가입된 회원입니다.",
    });
  }

  //DB 입력
  const insertUserRow = await userDao.insertUser(email, password, nickname);
  if (!insertUserRow) {
    return res.send({
      isSuccess: false,
      code: 400,
      message: "회원가입 실패. 관리자에게 문의해주세요.",
    });
  }

  return res.send({
    isSuccess: true,
    code: 200,
    message: "회원가입 성공",
  });

  //형식에 맞는 경우 true 리턴
};

exports.signin = async function (req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.send({
      isSuccess: false,
      code: 400,
      message: "회원정보를 입력해주세요.",
    });
  }

  // 회원여부 검사

  const isValidUser = await userDao.selectUser(email, password);
  if (!isValidUser) {
    return res.send({
      isSuccess: false,
      code: 410,
      message: "DB에러. 담당자에게 문의해주세요.",
    });
  }

  if (isValidUser.length < 1) {
    return res.send({
      isSuccess: false,
      code: 400,
      message: " 존재하지 않는 회원입니다.",
    });
  }

  //jwt 토큰 발급
  const [userInfo] = isValidUser;
  const userIdx = userInfo.userIdx;
  const token = jwt.sign(
    { userIdx: userIdx }, //페이로드
    jwtSecret //시크릿 키
  );

  return res.send({
    result: { token: token },
    isSuccess: true,
    code: 200,
    message: " 로그인 성공.",
  });
};

exports.getNicknameByToken = async function (req, res) {
  const { userIdx } = req.verifiedToken;

  const [userInfo] = await userDao.selectNicknameByUserIdx(userIdx);
  const nickname = userInfo.nickname;

  return res.send({
    result: { nickname: nickname },
    isSuccess: true,
    code: 200,
    message: " 토큰 검증 성공.",
  });
};

//회원탈퇴
exports.deleteUser = async function (req, res) {
  const { userIdx } = req.verifiedToken;

  if (!userIdx) {
    return res.send({
      isSuccess: false,
      code: 400,
      message: "userIdx를 입력해주세요..",
    });
  }

  const isValidTodoRow = await userDao.selectUser(email, password);
  if (isValidTodoRow.length < 1) {
    return res.send({
      isSuccess: false,
      code: 400,
      message: "유효한 요청이 아닙니다. 이메일 패스워드를 확인하세요",
    });
  }

  const deleteTodoRow = await userDao.deleteUser(userIdx);
  if (!deleteTodoRow) {
    return res.send({
      isSuccess: false,
      code: 400,
      message: "삭제 실패. 관리자에게 문의해주세요",
    });
  }

  return res.send({
    isSuccess: true,
    code: 200,
    message: "탈퇴 성공.",
  });
};

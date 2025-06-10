import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  getUserReservations,
  deleteReservation,
  updateUserProfile,
} from "../firebase/db";
import "../styles/common.css";

const maskName = (name) => {
  if (!name) return "";
  if (name.length <= 1) return name;
  if (name.length === 2) return name[0] + "*";
  const firstChar = name[0];
  const lastChar = name[name.length - 1];
  const middleMask = "*".repeat(name.length - 2);
  return firstChar + middleMask + lastChar;
};

// 학번을 학년, 반, 번호 형식으로 변환하는 함수
const formatStudentId = (studentId) => {
  if (!studentId || studentId.length !== 5) return studentId;
  const grade = studentId[0];
  const classNum = studentId.substring(1, 3);
  const number = studentId.substring(3);
  return `${grade}학년 ${classNum}반 ${number}번`;
};

function MyPage() {
  const { user, logout, completeUserProfile } = useAuth();
  const navigate = useNavigate();
  const [userReservations, setUserReservations] = useState([]);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [reservationsError, setReservationsError] = useState("");
  const [studentId, setStudentId] = useState(user?.studentId || "");
  const [name, setName] = useState(user?.name || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        // 관리자는 개인 예약 현황을 볼 필요가 없으므로 로딩 상태를 즉시 종료합니다.
        setLoadingReservations(false);
        setUserReservations([]); // 빈 배열로 설정하여 "예약된 내 공간이 없습니다." 메시지가 보이도록
        setReservationsError(""); // 에러 메시지 초기화
      } else if (user.studentId) {
        // 학생 사용자는 학번을 기준으로 예약 현황을 불러옵니다.
        loadUserReservations(user.studentId);
      } else {
        // 사용자 정보는 있지만 학번이 없는 경우 (예: 프로필 미완성 학생)
        setLoadingReservations(false);
        setUserReservations([]);
        setReservationsError("예약 정보를 불러올 수 없습니다.");
      }
    } else {
      // user 객체가 없는 경우 (로그아웃 상태 등)
      setLoadingReservations(false);
      setUserReservations([]);
      setReservationsError("로그인 정보가 없습니다.");
    }
  }, [user]);

  const loadUserReservations = async (studentId) => {
    try {
      setLoadingReservations(true);
      const data = await getUserReservations(studentId);
      setUserReservations(data);
    } catch (error) {
      setReservationsError("내 예약 목록을 불러오는 중 오류가 발생했습니다.");
      console.error("내 예약 목록 로딩 오류:", error);
    } finally {
      setLoadingReservations(false);
    }
  };

  const handleCancel = async (reservationId) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const cutoffTime = new Date(today);
    cutoffTime.setHours(8, 0, 0, 0);

    // 관리자는 시간 제한 없이 취소 가능
    if (user?.role !== "admin" && now > cutoffTime) {
      setReservationsError("오전 8시 이후에는 관리자에게 문의해주세요.");
      return;
    }

    if (window.confirm("이 예약을 취소하시겠습니까?")) {
      try {
        await deleteReservation(reservationId);
        await loadUserReservations(user.studentId);
      } catch (error) {
        setReservationsError("예약 취소 중 오류가 발생했습니다.");
        console.error("예약 취소 오류:", error);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!studentId.trim() || !name.trim()) {
        throw new Error("학번과 이름을 모두 입력해주세요.");
      }

      await completeUserProfile(studentId, name);
      setSuccess("프로필이 성공적으로 업데이트되었습니다.");
    } catch (error) {
      setError(error.message || "프로필 업데이트 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
        <p>로그인 정보가 없습니다.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ marginBottom: "1rem" }}>마이페이지</h2>
      </div>

      <div
        style={{
          backgroundColor: "white",
          padding: "2rem",
          borderRadius: "8px",
          boxShadow: "var(--shadow)",
          marginBottom: "2rem",
        }}
      >
        <h3 style={{ marginBottom: "1.5rem", color: "var(--primary-color)" }}>
          내 정보
        </h3>
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              value={user.email}
              disabled
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label htmlFor="studentId">학번</label>
            <input
              type="text"
              id="studentId"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="form-control"
              placeholder="학번을 입력하세요"
            />
          </div>
          <div className="form-group">
            <label htmlFor="name">이름</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-control"
              placeholder="이름을 입력하세요"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "저장 중..." : "저장하기"}
          </button>
        </form>
      </div>

      <div
        style={{
          backgroundColor: "white",
          padding: "2rem",
          borderRadius: "8px",
          boxShadow: "var(--shadow)",
        }}
      >
        <h3 style={{ marginBottom: "1.5rem", color: "var(--primary-color)" }}>
          내 예약 현황
        </h3>
        {reservationsError && (
          <div
            style={{
              padding: "1rem",
              marginBottom: "1rem",
              backgroundColor: "#fee",
              color: "#c00",
              borderRadius: "4px",
            }}
          >
            {reservationsError}
          </div>
        )}
        {loadingReservations ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            내 예약 로딩 중...
          </div>
        ) : userReservations.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            예약된 내 공간이 없습니다.
          </div>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            {userReservations.map((reservation) => (
              <div
                key={reservation.id}
                style={{
                  padding: "1.5rem",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h3 style={{ marginBottom: "0.5rem" }}>
                    {reservation.wing} - {reservation.floor} -{" "}
                    {reservation.room}
                  </h3>
                  <p
                    style={{
                      color: "var(--text-color)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {formatDate(reservation.date)}{" "}
                    {reservation.time === "lunch"
                      ? "점심시간"
                      : reservation.time === "cip1"
                      ? "CIP1"
                      : reservation.time === "cip2"
                      ? "CIP2"
                      : reservation.time === "cip3"
                      ? "CIP3"
                      : reservation.timeRange}
                  </p>
                  <p style={{ color: "var(--text-color)", fontSize: "0.9rem" }}>
                    예약자: {reservation.studentName}
                  </p>
                  <p style={{ color: "var(--text-color)", fontSize: "0.9rem" }}>
                    예약일시:{" "}
                    {new Date(reservation.createdAt.toDate()).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleCancel(reservation.id)}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#fee",
                    color: "#c00",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    opacity:
                      user?.role !== "admin" &&
                      new Date() > new Date(new Date().setHours(8, 0, 0, 0))
                        ? 0.5
                        : 1,
                  }}
                  disabled={
                    user?.role !== "admin" &&
                    new Date() > new Date(new Date().setHours(8, 0, 0, 0))
                  }
                >
                  {user?.role !== "admin" &&
                  new Date() > new Date(new Date().setHours(8, 0, 0, 0))
                    ? "취소 불가 (8시 이후)"
                    : "예약 취소"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyPage;

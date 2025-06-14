import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { getUserReservations, deleteReservation } from "../firebase/db";
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userReservations, setUserReservations] = useState([]);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [reservationsError, setReservationsError] = useState("");

  useEffect(() => {
    if (user && user.studentId) {
      loadUserReservations(user.studentId);
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
        <div style={{ display: "grid", gap: "1rem", marginBottom: "2rem" }}>
          <p style={{ fontSize: "1.1rem", color: "var(--text-color)" }}>
            <strong>학번:</strong> {formatStudentId(user.studentId)}
          </p>
          <p style={{ fontSize: "1.1rem", color: "var(--text-color)" }}>
            <strong>이름:</strong> {user.name}
          </p>
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: "0.8rem 1.5rem",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "bold",
            transition: "background-color 0.3s ease",
          }}
        >
          로그아웃
        </button>
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
                    예약자: {maskName(reservation.studentName)}
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
                  }}
                >
                  예약 취소
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

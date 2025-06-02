import React from "react";
import { MAIN_COLOR } from "./astroUtils";

export default function SideMenuHandle({ onClick, visible }) {
  if (!visible) return null;
  return (
    <div
      onClick={onClick}
      style={{
        position: "fixed",
        top: "50%",
        left: 0,
        transform: "translateY(-50%)",
        zIndex: 1300,
        cursor: "pointer",
        width: 20,
        height: 60,
        background: "rgba(139,0,0,0.5)",
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12,
        boxShadow: "2px 0 8px #0002",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        transition: "background 0.2s",
      }}
    >
      <div
        style={{
          width: 13,
          height: 13,
          background: "#fff",
          border: `2px solid ${MAIN_COLOR}`,
          borderRadius: "50%",
          marginLeft: 3,
          boxShadow: "0 1px 4px #0001",
        }}
      />
    </div>
  );
}
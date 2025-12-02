import React from "react";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        
       

        {/* Liên hệ/Support */}
        <div className="footer-section">
          <h4>Hỗ trợ</h4>
          <ul>
            <li><a href="#">Hướng dẫn</a></li>
            <li><a href="#">Điều khoản</a></li>
            <li><a href="#">Liên hệ admin</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} Motorbike NFT — All Rights Reserved.
      </div>
    </footer>
  );
}

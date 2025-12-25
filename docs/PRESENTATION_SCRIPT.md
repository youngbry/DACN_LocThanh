# KỊCH BẢN THUYẾT TRÌNH: DỰ ÁN NFT MOTORBIKE MARKETPLACE

## Slide 2: Nội dung chính (Agenda)

**Lời thoại gợi ý:**
"em xin chào thầy và các bạn em là... nhóm 9 nhóm em gồm 2 thành viên gồm em và bạn Nguyễn Thành Lộc sau đây em xin phép trình bày dự án của nhóm em. bài thuyết trình của nhóm em hôm nay sẽ đi qua 4 phần chính. Đầu tiên là phần Tổng quan để hiểu tại sao nhóm chúng em lại chọn dự án này. Tiếp theo, em sẽ đi sâu vào các giải pháp công nghệ mà nhóm đã áp dụng như Smart Contract và tích hợp AI. Phần quan trọng nhất là Kết quả thực nghiệm, nơi em sẽ trình bày các tính năng thực tế đã hoàn thiện. Cuối cùng là phần Tổng kết và định hướng phát triển trong tương lai."

---

## Slide 4: Chương 1 - Tổng quan dự án

**Lời thoại gợi ý:**
"Tại sao lại là NFT cho xe máy? Như chúng ta đã biết, thị trường xe máy tại Việt Nam rất lớn, nhưng việc mua bán xe cũ hiện nay gặp rất nhiều rủi ro. Người mua khó lòng biết được lịch sử thật sự của chiếc xe, liệu số khung số máy có bị đục sửa hay không.

Dự án của em ra đời nhằm giải quyết vấn đề này bằng cách 'Số hóa' mỗi chiếc xe thành một NFT duy nhất trên Blockchain. Mỗi NFT sẽ chứa các thông tin định danh không thể thay đổi như số khung (VIN), số máy và model.

Điểm khác biệt của dự án này so với các sàn NFT thông thường là:

1. **Tính thực tế:** Tập trung vào tài sản hữu hình là xe máy.
2. **Sự tin cậy:** Người dùng có thể kiểm tra từng Block thông qua công cụ Explorer nội bộ để xác thực giao dịch.
3. **Trải nghiệm người dùng:** Giá cả được niêm yết bằng VND để phù hợp với thị trường Việt Nam, thay vì dùng giá ETH biến động mạnh, giúp người dùng dễ dàng tiếp cận hơn."

---

## Slide 5: Chương 2 - Cơ sở lý thuyết & Công nghệ

**Lời thoại gợi ý:**
"Để hiện thực hóa ý tưởng này, em đã lựa chọn một hệ sinh thái công nghệ hiện đại và mạnh mẽ. Cốt lõi của hệ thống là Blockchain Ethereum, nơi lưu trữ các Smart Contract được viết bằng ngôn ngữ Solidity.

Về tiêu chuẩn Token, em sử dụng chuẩn ERC-721 – đây là chuẩn phổ biến nhất cho NFT, cho phép mỗi chiếc xe máy là một thực thể duy nhất, không thể thay thế. Người dùng sẽ tương tác với hệ thống thông qua các ví điện tử như Rabby hoặc MetaMask, đảm bảo tính bảo mật và quyền sở hữu cá nhân tối cao."

---

## Slide 6: Kiến trúc hệ thống (System Architecture)

**Lời thoại gợi ý:**
"Hệ thống của em được xây dựng theo mô hình 3 lớp để tối ưu hóa hiệu năng và chi phí:

1. **Lớp Frontend:** Sử dụng ReactJS kết hợp với thư viện Ethers.js. Đây là nơi người dùng thực hiện các thao tác như kết nối ví, xem danh sách xe và thực hiện mua bán.
2. **Lớp Backend (Off-chain):** Chạy trên Node.js và Express. Lớp này đóng vai trò hỗ trợ, xử lý các tác vụ không cần đưa lên Blockchain để tiết kiệm chi phí (gas), ví dụ như: quản lý báo cáo sự cố, lưu trữ log hệ thống hoặc xử lý các yêu cầu mở khóa NFT từ phía người dùng.
3. **Lớp Blockchain (On-chain):** Đây là 'trái tim' của dự án với hai hợp đồng thông minh chính:
   - `MotorbikeNFT`: Quản lý việc tạo (mint) xe mới và thông tin kỹ thuật của xe.
   - `MotorbikeMarketplace`: Xử lý logic mua bán, niêm yết giá và lịch sử biến động giá.

Sự kết hợp này giúp hệ thống vừa đảm bảo tính phi tập trung của Blockchain, vừa có tốc độ phản hồi nhanh chóng của các ứng dụng web truyền thống."

---

## Slide 8: Chương 4 - Kết luận (Kết quả đạt được)

**Lời thoại gợi ý:**
"Sau quá trình nghiên cứu và thực hiện, dự án đã đạt được những kết quả quan trọng. Đầu tiên, chúng em đã xây dựng thành công một hệ thống DApp hoàn chỉnh, cho phép người quản lý thực hiện toàn bộ quy trình từ đăng ký xe, quản lý cho đến giao dịch NFT một cách mượt mà.

Thứ hai, dự án đã giải quyết triệt để bài toán về sự minh bạch. Mọi thông tin về nguồn gốc phương tiện và lịch sử mua bán đều được ghi lại vĩnh viễn trên Blockchain, không ai có thể sửa đổi hay gian lận.

Cuối cùng, việc tự động hóa quy trình bằng Smart Contract không chỉ giúp giảm thiểu các thủ tục hành chính rườm rà mà còn mang lại sự an tâm tuyệt đối cho người tham gia giao dịch. Qua đồ án này, nhóm cũng đã làm chủ được các công nghệ mới nhất trong lĩnh vực Web3."

---

## Slide 9: Chương 4 - Kết luận (Hướng phát triển tương lai)

**Lời thoại gợi ý:**
"Tuy nhiên, đây mới chỉ là bước khởi đầu. Trong tương lai, dự án có thể mở rộng theo 3 hướng chính:

1. **Tích hợp eKYC:** Chúng em dự định kết hợp với dữ liệu Căn cước công dân gắn chip để định danh người dùng. Điều này sẽ giúp liên kết địa chỉ ví với danh tính thực, tăng cường tính pháp lý cho các tài sản NFT.
2. **Phát triển Mobile App:** Một ứng dụng di động sẽ giúp người dùng quản lý xe tiện lợi hơn, đặc biệt là tính năng quét mã QR để tra cứu thông tin xe ngay tại hiện trường.
3. **Mở rộng hệ sinh thái:** Mô hình này không chỉ áp dụng cho xe máy mà có thể mở rộng ra ô tô, bất động sản hoặc bất kỳ tài sản có giá trị cao nào cần sự minh bạch.

Đó là toàn bộ nội dung bài thuyết trình của nhóm em. Em xin chân thành cảm ơn thầy cô và các bạn đã chú ý lắng nghe. Sau đây, em xin phép được bắt đầu phần Demo thực tế hệ thống."

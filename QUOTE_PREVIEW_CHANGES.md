# Quote Preview Feature Implementation

## Tổng quan

Đã implement tính năng **Quote Preview** để giải quyết vấn đề bảo mật khi quote content được đưa trực tiếp vào message input và có thể chỉnh sửa.

## Những thay đổi đã thực hiện

### 1. Tạo component mới: `QuotePreview.js`

**Đường dẫn:** `src/compose/QuotePreview.js`

**Chức năng:**
- Hiển thị quote content readonly (không thể chỉnh sửa)
- Hiển thị tên người gửi và link "said:"
- Có nút X để xóa quote
- Styling tương tự Telegram/Discord với border màu xanh

**Props:**
```flow
type Props = {|
  message: Message | Outbox,
  user: UserOrBot,
  rawContent: string,
  onRemove: () => void,
|};
```

### 2. Sửa đổi `ComposeBox.js`

**Các thay đổi chính:**

#### a) Thêm import và state mới
```javascript
import QuotePreview from './QuotePreview';

// State để lưu quote data riêng biệt
const [quoteData, setQuoteData] = useState<?{|
  message: Message | Outbox,
  user: UserOrBot,
  rawContent: string,
|}>(null);
```

#### b) Sửa logic `doQuoteAndReply`
**Trước:** Đưa quote text vào message input
```javascript
const quoteAndReplyText = getQuoteAndReplyText({...});
setMessageInputValue(state => 
  state.value.replace(quotingPlaceholder, () => quoteAndReplyText)
);
```

**Sau:** Lưu quote data vào state riêng
```javascript
setQuoteData({
  message,
  user,
  rawContent,
});
```

#### c) Thêm callback xóa quote
```javascript
const handleRemoveQuote = useCallback(() => {
  setQuoteData(null);
}, []);
```

#### d) Sửa logic `handleSubmit`
Combine quote + reply content khi gửi:
```javascript
let finalMessage = messageInputValue;
if (quoteData) {
  const quoteAndReplyText = getQuoteAndReplyText({
    message: quoteData.message,
    rawContent: quoteData.rawContent,
    user: quoteData.user,
    realm: auth.realm,
    streamsById,
    zulipFeatureLevel,
    _,
  });
  finalMessage = `${quoteAndReplyText}\n\n${messageInputValue}`;
}
```

#### e) Thêm QuotePreview vào render
```javascript
return (
  <View style={styles.wrapper}>
    <MentionWarnings narrow={narrow} stream={stream} ref={mentionWarnings} />
    {quoteData && (
      <QuotePreview
        message={quoteData.message}
        user={quoteData.user}
        rawContent={quoteData.rawContent}
        onRemove={handleRemoveQuote}
      />
    )}
    {/* ... existing UI ... */}
  </View>
);
```

## Lợi ích của thay đổi

### ✅ Bảo mật
- **Quote content không thể chỉnh sửa** - loại bỏ rủi ro sai lệch nội dung
- **Phân biệt rõ ràng** giữa quote và reply content

### ✅ UX tốt hơn
- **UI rõ ràng** - quote hiển thị ở block riêng phía trên
- **Dễ xóa quote** - chỉ cần click nút X
- **Giống các app phổ biến** - Telegram, Discord

### ✅ Không breaking changes
- **Logic cũ vẫn hoạt động** - chỉ thay đổi cách hiển thị
- **Message format không đổi** - server vẫn nhận được format markdown giống như trước

## Cách hoạt động

1. **User click "Quote and Reply"** → `doQuoteAndReply()` được gọi
2. **Fetch raw content** từ server
3. **Lưu vào `quoteData` state** thay vì đưa vào message input
4. **QuotePreview hiển thị** ở phía trên compose box
5. **User nhập reply** trong message input (riêng biệt)
6. **Khi gửi:** Combine quote + reply content thành final message
7. **Clear quote** sau khi gửi thành công

## Code review notes

- **Tối thiểu thay đổi code cũ** - chỉ refactor logic cần thiết
- **Type safety** - sử dụng Flow types cho tất cả props và state
- **Consistent styling** - sử dụng theme context và createStyleSheet
- **Error handling** - giữ nguyên logic error handling hiện tại
- **Performance** - không impact performance, chỉ thay đổi cách render 
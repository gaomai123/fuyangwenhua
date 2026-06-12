# 鑹轰汉搴撳皬绋嬪簭

鏈」鐩厛鍋氭湰鍦版渶灏忓彲杩愯鐗堟湰锛屽垎涓轰笁涓儴鍒嗭細

- `server`锛歂ode.js + Express 鍚庣鎺ュ彛锛孲QLite 鏁版嵁搴擄紝鏂囦欢涓婁紶鐩綍
- `miniprogram`锛氬井淇″皬绋嬪簭鍘熺敓鍓嶇
- `admin-web`锛氱畝鍗曠鐞嗗憳鍚庡彴缃戦〉

## 褰撳墠闃舵

绗崄闃舵锛氬畬鏁磋仈璋冨凡楠岃瘉銆?
宸插畬鎴愶細

- 鍒涘缓椤圭洰鐩綍缁撴瀯
- 鍒涘缓 Express 鍚庣鏈嶅姟
- 娣诲姞鍋ュ悍妫€鏌ユ帴鍙ｏ細`GET /api/health`
- 鎺ュ叆 SQLite 鏁版嵁搴?- 鍒涘缓 `artists` 鑹轰汉璧勬枡琛?- 鍒涘缓 `admins` 绠＄悊鍛樿处鍙疯〃
- 鍒濆鍖栭粯璁ょ鐞嗗憳璐﹀彿
- 娣诲姞鑹轰汉璧勬枡鎻愪氦鎺ュ彛锛歚POST /api/artists`
- 娣诲姞灞曠ず绔垪琛ㄦ帴鍙ｏ細`GET /api/artists`
- 娣诲姞灞曠ず绔鎯呮帴鍙ｏ細`GET /api/artists/:id`
- 娣诲姞绠＄悊鍛樼櫥褰曟帴鍙ｏ細`POST /api/admin/login`
- 娣诲姞绠＄悊鍛樺鏍告帴鍙ｏ細閫氳繃銆侀┏鍥炪€佸垹闄ゃ€佷慨鏀硅祫鏂?- 娣诲姞绠€鍗曠鐞嗗憳缃戦〉鍚庡彴锛歚admin-web`
- 娣诲姞寰俊灏忕▼搴忛椤点€佹彁浜ら〉銆佽鎯呴〉銆佹彁浜ゆ垚鍔熼〉
- 娣诲姞澶村儚涓婁紶鎺ュ彛锛歚POST /api/uploads/avatar`
- 娣诲姞浣滃搧鐓т笂浼犳帴鍙ｏ細`POST /api/uploads/photos`
- 灏忕▼搴忔彁浜ら〉鏀寔閫夋嫨澶村儚鍜屼綔鍝佺収涓婁紶
- 楠岃瘉瀹屾暣娴佺▼锛氭彁浜よ祫鏂欍€佸緟瀹℃牳闅愯棌銆佺鐞嗗憳閫氳繃銆佸睍绀虹鍙

## 鏈湴杩愯鍚庣

鍦?PowerShell 涓墽琛岋細

```bash
cd server
npm.cmd run dev
```

濡傛灉鐪嬪埌锛?
```text
Server is running at http://127.0.0.1:3001
```

璇存槑鍚庣宸茬粡鍚姩銆?
鐒跺悗鎵撳紑娴忚鍣ㄨ闂細

```text
http://127.0.0.1:3001/api/health
```

姝ｅ父浼氱湅鍒帮細

```json
{
  "success": true,
  "message": "server is running",
  "database": "connected"
}
```

娉ㄦ剰锛氬湪 Windows PowerShell 涓紝濡傛灉鐩存帴杈撳叆 `npm` 鎶モ€滅姝㈣繍琛岃剼鏈€濓紝璇蜂娇鐢?`npm.cmd`銆?
## 鑹轰汉鎻愪氦璧勬枡鎺ュ彛

鎺ュ彛鍦板潃锛?
```text
POST http://127.0.0.1:3001/api/artists
```

蹇呭～瀛楁锛?
```text
stage_name  鑹哄悕
real_name   鐪熷疄濮撳悕
phone       鎵嬫満鍙?city        鍩庡競
tags        绫诲瀷鏍囩锛屼緥濡傦細姝屾墜,DJ
```

鎻愪氦鎴愬姛鍚庯紝鐘舵€侀粯璁や负锛?
```text
pending
```

## 灞曠ず绔垪琛ㄦ帴鍙?
鎺ュ彛鍦板潃锛?
```text
GET http://127.0.0.1:3001/api/artists
```

杩欎釜鎺ュ彛鍙繑鍥炲凡瀹℃牳閫氳繃鐨勮壓浜猴細

```text
status = approved
```

鏀寔鎼滅储鍙傛暟锛?
```text
city      鍩庡競锛屼緥濡傦細涓婃捣
tag       绫诲瀷鏍囩锛屼緥濡傦細DJ
keyword   鍏抽敭璇嶏紝鍙悳绱㈣壓鍚嶃€佸煄甯傘€佹爣绛俱€佺畝浠?```

绀轰緥锛?
```text
http://127.0.0.1:3001/api/artists?city=涓婃捣&tag=DJ
```

## 灞曠ず绔鎯呮帴鍙?
鎺ュ彛鍦板潃锛?
```text
GET http://127.0.0.1:3001/api/artists/1
```

娉ㄦ剰锛氬鏋滆壓浜轰笉鏄?`approved` 鐘舵€侊紝鍗充娇鐭ラ亾 id锛屼篃鏌ヤ笉鍒拌鎯呫€?
## 褰撳墠榛樿绠＄悊鍛?
鏈湴娴嬭瘯鐢ㄨ处鍙凤細

```text
璐﹀彿锛歛dmin
瀵嗙爜锛歛dmin123
```

鍚庨潰鍋氱鐞嗗憳鍚庡彴鐧诲綍鏃朵細鐢ㄥ埌瀹冦€?
## 鎵撳紑绠＄悊鍛樺悗鍙?
鍏堝惎鍔ㄥ悗绔細

```bash
cd server
npm.cmd run dev
```

鐒跺悗鎵撳紑娴忚鍣ㄨ闂細

```text
http://127.0.0.1:3001/admin
```

涔熷彲浠ョ洿鎺ヨ闂櫥褰曢〉锛?
```text
http://127.0.0.1:3001/admin/login.html
```

鐧诲綍鍚庡彲浠ワ細

- 鏌ョ湅寰呭鏍歌壓浜?- 鏌ョ湅鍏ㄩ儴鑹轰汉
- 瀹℃牳閫氳繃
- 椹冲洖
- 鍒犻櫎
- 淇敼璧勬枡

## 鎵撳紑寰俊灏忕▼搴?
鍏堝惎鍔ㄥ悗绔細

```bash
cd server
npm.cmd run dev
```

鐒跺悗鎵撳紑寰俊寮€鍙戣€呭伐鍏凤細

1. 閫夋嫨鈥滃鍏ラ」鐩€?2. 椤圭洰鐩綍閫夋嫨锛歚C:\Users\Administrator\Desktop\artist-miniapp\miniprogram`
3. AppID 鍙互閫夋嫨娴嬭瘯鍙锋垨浣跨敤娓稿妯″紡
4. 鏈湴寮€鍙戞椂闇€瑕佸叧闂€滄牎楠屽悎娉曞煙鍚嶁€?
灏忕▼搴忓綋鍓嶅寘鍚細

- 棣栭〉锛氬睍绀哄凡瀹℃牳閫氳繃鐨勮壓浜?- 鎻愪氦璧勬枡椤碉細鑹轰汉鎻愪氦璧勬枡锛岄粯璁よ繘鍏?`pending`
- 璇︽儏椤碉細鏌ョ湅鑹轰汉鍏紑璧勬枡
- 鎻愪氦鎴愬姛椤碉細鏄剧ず鈥滆祫鏂欏凡鎻愪氦锛岀瓑寰呭鏍糕€?
褰撳墠澶村儚鍜屼綔鍝佺収鍙互鍦ㄥ皬绋嬪簭涓€夋嫨鍥剧墖涓婁紶锛涜棰戜粛鐒跺～鍐欎綔鍝侀摼鎺ワ紝璇︽儏椤电殑瑙嗛灞曠ず鏂瑰紡鏄鍒堕摼鎺ャ€?
## 鍥剧墖涓婁紶鎺ュ彛

涓婁紶澶村儚锛?
```text
POST http://127.0.0.1:3001/api/uploads/avatar
```

瀛楁鍚嶏細

```text
file
```

涓婁紶浣滃搧鐓э細

```text
POST http://127.0.0.1:3001/api/uploads/photos
```

瀛楁鍚嶏細

```text
files
```

涓婁紶鍚庣殑鍥剧墖浼氫繚瀛樺湪锛?
```text
server/uploads/avatars
server/uploads/photos
```

鍥剧墖璁块棶鍦板潃绫讳技锛?
```text
http://127.0.0.1:3001/uploads/avatars/鏂囦欢鍚?jpg
```

## 鎵嬪姩鑱旇皟娴佺▼

1. 鍚姩鍚庣锛?
```bash
cd server
npm.cmd run dev
```

2. 鎵撳紑寰俊寮€鍙戣€呭伐鍏凤紝瀵煎叆锛?
```text
C:\Users\Administrator\Desktop\artist-miniapp\miniprogram
```

3. 鍦ㄥ皬绋嬪簭鎻愪氦璧勬枡椤靛～鍐欒壓浜鸿祫鏂欙紝閫夋嫨澶村儚鍜屼綔鍝佺収锛岀偣鍑绘彁浜ゃ€?
4. 鎻愪氦鎴愬姛鍚庯紝鎵撳紑鍚庡彴锛?
```text
http://127.0.0.1:3001/admin
```

5. 浣跨敤榛樿绠＄悊鍛樼櫥褰曪細

```text
璐﹀彿锛歛dmin
瀵嗙爜锛歛dmin123
```

6. 鍦ㄥ悗鍙扮湅鍒板緟瀹℃牳鑹轰汉锛岀偣鍑烩€滈€氳繃鈥濄€?
7. 鍥炲埌灏忕▼搴忛椤碉紝鍒锋柊鎴栭噸鏂拌繘鍏ラ椤碉紝灏辫兘鐪嬪埌宸查€氳繃鐨勮壓浜恒€?
娉ㄦ剰锛氳壓浜哄垰鎻愪氦鏃舵槸 `pending`锛屼笉浼氬嚭鐜板湪灏忕▼搴忛椤碉紱鍙湁绠＄悊鍛樺鏍搁€氳繃鍙樻垚 `approved` 鍚庢墠浼氬睍绀恒€?
## 绠＄悊鍛樻帴鍙?
鐧诲綍锛?
```text
POST http://127.0.0.1:3001/api/admin/login
```

璇锋眰绀轰緥锛?
```json
{
  "username": "admin",
  "password": "admin123"
}
```

鐧诲綍鎴愬姛鍚庝細杩斿洖 `token`銆傚悗缁鐞嗗憳鎺ュ彛闇€瑕佸湪璇锋眰澶撮噷甯︿笂锛?
```text
Authorization: Bearer 浣犵殑token
```

鏌ョ湅鎵€鏈夎壓浜猴細

```text
GET http://127.0.0.1:3001/api/admin/artists
```

鏌ョ湅寰呭鏍歌壓浜猴細

```text
GET http://127.0.0.1:3001/api/admin/artists/pending
```

瀹℃牳閫氳繃锛?
```text
PATCH http://127.0.0.1:3001/api/admin/artists/1/approve
```

椹冲洖锛?
```text
PATCH http://127.0.0.1:3001/api/admin/artists/1/reject
```

璇锋眰绀轰緥锛?
```json
{
  "reason": "璧勬枡涓嶅畬鏁?
}
```

淇敼鑹轰汉璧勬枡锛?
```text
PATCH http://127.0.0.1:3001/api/admin/artists/1
```

鍒犻櫎鑹轰汉璧勬枡锛?
```text
DELETE http://127.0.0.1:3001/api/admin/artists/1
```

/* poko — TOEIC 단어 학습 데이터
   섹션(sec) 코드는 화면 로직(app.js)의 groupDefs()와 짝을 맞춘다:
     '01'            → PART 1 사진 묘사 고난도 어휘 (gp1)
     '02'..'05'      → PART 5·6 빈칸 채우기 핵심 단어 (g56)
     '06'..'11'      → 콜로케이션 · 짝꿍 표현 (gco)
     '12'..'14'      → 950+ 고득점 함정 세트 (gadv)
   TOPIC_OF[i]는 단어 i의 주제 묶음(topic id) — 현재는 섹션당 주제 1개로 단순화. */

const RAW_SECTIONS = [
  { sec: '01', topic: 't-photo', label: '사진 속 동작·사물', words: [
    ['arrange', '동사', '정리하다, 배열하다', 'Some tools have been arranged on the workbench.', '몇몇 공구들이 작업대 위에 정리되어 있다.'],
    ['stack', '동사', '쌓다', 'Boxes are being stacked near the loading dock.', '상자들이 하역장 근처에 쌓이고 있다.'],
    ['lean', '동사', '기대다, 기울다', 'A ladder is leaning against the wall.', '사다리가 벽에 기대어 있다.'],
    ['pave', '동사', '(도로 등을) 포장하다', 'Workers are paving the road.', '작업자들이 도로를 포장하고 있다.'],
    ['browse', '동사', '둘러보다, 훑어보다', 'A customer is browsing through the merchandise.', '한 고객이 상품을 둘러보고 있다.'],
    ['examine', '동사', '살펴보다, 점검하다', 'The mechanic is examining the engine.', '정비공이 엔진을 살펴보고 있다.'],
    ['sort', '동사', '분류하다', 'She is sorting documents into folders.', '그녀는 서류를 폴더별로 분류하고 있다.'],
    ['trim', '동사', '다듬다, 손질하다', 'A gardener is trimming the hedges.', '정원사가 산울타리를 다듬고 있다.'],
    ['assemble', '동사', '조립하다, 모으다', 'Workers are assembling furniture in the warehouse.', '작업자들이 창고에서 가구를 조립하고 있다.'],
    ['unload', '동사', '짐을 내리다', 'Men are unloading boxes from the truck.', '남자들이 트럭에서 상자를 내리고 있다.'],
    ['overlook', '동사', '내려다보다', 'The balcony overlooks the harbor.', '발코니에서 항구가 내려다보인다.'],
    ['fold', '동사', '접다', 'The employee is folding the tablecloths.', '직원이 식탁보를 접고 있다.'],
  ]},
  { sec: '02', topic: 't-hr', label: '채용·인사', words: [
    ['applicant', '명사', '지원자', 'All applicants must submit a résumé by Friday.', '모든 지원자는 금요일까지 이력서를 제출해야 한다.'],
    ['candidate', '명사', '후보자, 지원자', 'The hiring committee interviewed three candidates for the position.', '채용 위원회는 그 직책에 대해 세 명의 후보자를 면접했다.'],
    ['résumé', '명사', '이력서', 'Please attach your résumé to the online application.', '온라인 지원서에 이력서를 첨부해 주세요.'],
    ['qualification', '명사', '자격, 자질', 'The job requires strong qualifications in accounting.', '그 일자리는 회계 분야의 확실한 자격을 요구한다.'],
    ['recruit', '동사', '채용하다, 모집하다', 'The company plans to recruit ten new engineers this quarter.', '회사는 이번 분기에 신입 엔지니어 10명을 채용할 계획이다.'],
    ['vacancy', '명사', '공석, 결원', 'There is a vacancy in the marketing department.', '마케팅 부서에 공석이 하나 있다.'],
    ['supervisor', '명사', '감독관, 상사', 'New employees will report directly to their supervisor.', '신입 사원들은 직속 상사에게 직접 보고할 것이다.'],
    ['orientation', '명사', '오리엔테이션, 예비 교육', 'All new hires must attend the orientation session.', '모든 신입 사원은 오리엔테이션에 참석해야 한다.'],
    ['probationary', '형용사', '수습의, 견습의', 'Employees are evaluated at the end of the probationary period.', '직원들은 수습 기간이 끝날 때 평가를 받는다.'],
    ['promote', '동사', '승진시키다', 'She was promoted to senior manager last month.', '그녀는 지난달 수석 매니저로 승진했다.'],
    ['terminate', '동사', '해고하다, 종료하다', "The contract may be terminated with 30 days' notice.", '계약은 30일 전 통지로 종료될 수 있다.'],
    ['personnel', '명사', '인사부, 직원들', 'Contact the personnel department for benefits information.', '복리후생 정보는 인사부에 문의하세요.'],
  ]},
  { sec: '03', topic: 't-finance', label: '재무·회계', words: [
    ['invoice', '명사', '청구서, 송장', 'Please send the invoice to our accounting office.', '청구서를 저희 회계 부서로 보내 주세요.'],
    ['reimbursement', '명사', '환급, 상환', 'Employees can request reimbursement for travel expenses.', '직원들은 출장 경비에 대한 환급을 요청할 수 있다.'],
    ['expenditure', '명사', '지출, 경비', 'The company reduced its expenditure on office supplies.', '회사는 사무용품에 대한 지출을 줄였다.'],
    ['revenue', '명사', '수익, 세입', 'Quarterly revenue increased by 12 percent.', '분기 수익이 12퍼센트 증가했다.'],
    ['budget', '명사', '예산', 'The marketing budget was approved by the board.', '마케팅 예산이 이사회에서 승인되었다.'],
    ['audit', '명사·동사', '감사(하다)', 'An external auditor will audit the accounts next week.', '외부 감사인이 다음 주 계정을 감사할 것이다.'],
    ['surplus', '명사', '흑자, 잉여', 'The company reported a budget surplus this year.', '회사는 올해 예산 흑자를 보고했다.'],
    ['deficit', '명사', '적자, 부족', 'The department is operating at a deficit.', '그 부서는 적자 상태로 운영되고 있다.'],
    ['installment', '명사', '할부, 분할 납입', 'Customers may pay in monthly installments.', '고객들은 매달 할부로 지불할 수 있다.'],
    ['withhold', '동사', '원천징수하다, 보류하다', 'The employer will withhold taxes from each paycheck.', '고용주는 각 급여에서 세금을 원천징수할 것이다.'],
    ['fiscal', '형용사', '회계의, 재정의', 'The fiscal year ends in December.', '회계 연도는 12월에 끝난다.'],
    ['overdue', '형용사', '기한이 지난, 연체된', 'The invoice is now two weeks overdue.', '그 청구서는 이제 2주가 연체되었다.'],
  ]},
  { sec: '04', topic: 't-office', label: '사무·행정', words: [
    ['correspondence', '명사', '서신, 연락', 'All correspondence should be directed to the main office.', '모든 서신은 본사로 보내야 한다.'],
    ['draft', '명사·동사', '초안(을 작성하다)', 'She drafted the proposal before the meeting.', '그녀는 회의 전에 제안서 초안을 작성했다.'],
    ['confidential', '형용사', '기밀의', 'The report contains confidential financial data.', '그 보고서에는 기밀 재무 자료가 포함되어 있다.'],
    ['memorandum', '명사', '회람, 메모', 'A memorandum was circulated to all staff members.', '전 직원에게 회람이 배포되었다.'],
    ['distribute', '동사', '배포하다', 'The agenda will be distributed before the meeting.', '안건은 회의 전에 배포될 것이다.'],
    ['authorize', '동사', '승인하다, 권한을 부여하다', 'Only the manager can authorize this purchase.', '매니저만이 이 구매를 승인할 수 있다.'],
    ['filing', '명사', '서류 정리, 보관', 'The filing system was reorganized last week.', '서류 정리 체계가 지난주에 재정비되었다.'],
    ['stationery', '명사', '문구류', 'Please order more stationery for the office.', '사무실에 쓸 문구류를 더 주문해 주세요.'],
    ['proofread', '동사', '교정하다', 'Ask a colleague to proofread the document before printing.', '인쇄 전에 동료에게 문서 교정을 부탁하세요.'],
    ['archive', '동사·명사', '보관하다, 기록보관소', 'Old records are archived in the basement.', '오래된 기록들은 지하실에 보관되어 있다.'],
    ['circulate', '동사', '회람시키다, 유포하다', 'The memo was circulated to every department.', '그 메모는 모든 부서에 회람되었다.'],
    ['notify', '동사', '알리다, 통지하다', 'Staff will be notified of the schedule change by e-mail.', '직원들은 이메일로 일정 변경을 통지받을 것이다.'],
  ]},
  { sec: '05', topic: 't-logistics', label: '물류·주문', words: [
    ['shipment', '명사', '배송, 수송', 'The shipment is expected to arrive on Monday.', '그 배송품은 월요일에 도착할 예정이다.'],
    ['warehouse', '명사', '창고', 'The goods are stored in a warehouse near the port.', '그 상품은 항구 근처 창고에 보관되어 있다.'],
    ['inventory', '명사', '재고', 'The store conducts an inventory check every month.', '그 매장은 매달 재고 조사를 실시한다.'],
    ['supplier', '명사', '공급업체', 'We switched to a new supplier for raw materials.', '우리는 원자재 공급업체를 새로 바꾸었다.'],
    ['delivery', '명사', '배달, 배송', 'Delivery times may vary during the holiday season.', '연휴 기간에는 배송 시간이 달라질 수 있다.'],
    ['damaged', '형용사', '손상된', 'Please report any damaged items upon delivery.', '배송 시 손상된 물품이 있으면 알려 주세요.'],
    ['expedite', '동사', '신속히 처리하다', 'The manager asked to expedite the shipping process.', '매니저는 배송 절차를 신속히 처리해 달라고 요청했다.'],
    ['freight', '명사', '화물', 'Freight charges are included in the total price.', '화물 운송비는 총 가격에 포함되어 있다.'],
    ['carrier', '명사', '운송업체', 'The package was handed over to a shipping carrier.', '그 소포는 운송업체에 인계되었다.'],
    ['backorder', '명사', '이월 주문', 'The item is on backorder and will ship next week.', '그 상품은 이월 주문 상태이며 다음 주에 발송될 것이다.'],
    ['itinerary', '명사', '여행 일정표', 'The travel agent prepared a detailed itinerary.', '여행사 직원이 상세한 일정표를 준비했다.'],
    ['consignment', '명사', '위탁 화물, 탁송품', 'The consignment was cleared through customs yesterday.', '그 위탁 화물은 어제 세관을 통과했다.'],
  ]},
  { sec: '06', topic: 't-marketing', label: '마케팅·홍보', words: [
    ['boost sales', '구동사', '매출을 신장시키다', 'The new campaign helped boost sales by 20 percent.', '새 캠페인은 매출을 20퍼센트 신장시키는 데 도움이 되었다.'],
    ['place an order', '구동사', '주문하다', 'Customers can place an order through the website.', '고객들은 웹사이트를 통해 주문할 수 있다.'],
    ['meet a deadline', '구동사', '마감 기한을 맞추다', 'The team worked overtime to meet the deadline.', '팀은 마감 기한을 맞추기 위해 초과 근무를 했다.'],
    ['raise awareness', '구동사', '인식을 높이다', 'The event was designed to raise awareness of the brand.', '그 행사는 브랜드 인식을 높이기 위해 기획되었다.'],
    ['target audience', '명사구', '목표 고객층', 'The ad campaign focuses on a younger target audience.', '그 광고 캠페인은 더 젊은 목표 고객층에 초점을 맞춘다.'],
    ['conduct a survey', '구동사', '설문조사를 실시하다', 'The firm conducted a survey to measure customer satisfaction.', '그 회사는 고객 만족도를 측정하기 위해 설문조사를 실시했다.'],
    ['draw attention', '구동사', '관심을 끌다', 'The bright packaging draws attention on store shelves.', '밝은 색 포장이 매장 진열대에서 관심을 끈다.'],
    ['generate revenue', '구동사', '수익을 창출하다', 'The new product line is expected to generate revenue quickly.', '새 제품 라인은 빠르게 수익을 창출할 것으로 기대된다.'],
    ['build brand loyalty', '구동사', '브랜드 충성도를 쌓다', 'Great customer service helps build brand loyalty.', '훌륭한 고객 서비스는 브랜드 충성도를 쌓는 데 도움이 된다.'],
    ['roll out a product', '구동사', '제품을 출시하다', 'The company will roll out the product nationwide next month.', '회사는 다음 달 전국적으로 제품을 출시할 것이다.'],
    ['track record', '명사구', '실적, 이력', 'The firm has a strong track record in customer service.', '그 회사는 고객 서비스에서 확실한 실적을 갖고 있다.'],
    ['word of mouth', '명사구', '입소문', 'Much of our business comes from word of mouth.', '우리 사업의 상당 부분은 입소문에서 나온다.'],
  ]},
  { sec: '07', topic: 't-event', label: '행사·회의', words: [
    ['keynote speaker', '명사구', '기조 연설자', 'The conference will feature a well-known keynote speaker.', '그 컨퍼런스에는 유명한 기조 연설자가 나올 것이다.'],
    ['reschedule a meeting', '구동사', '회의 일정을 변경하다', 'We had to reschedule the meeting due to a conflict.', '일정이 겹쳐서 회의 일정을 변경해야 했다.'],
    ['attend a conference', '구동사', '컨퍼런스에 참석하다', 'Employees are encouraged to attend the annual conference.', '직원들은 연례 컨퍼런스에 참석하도록 권장된다.'],
    ['venue for the event', '명사구', '행사 장소', 'The hotel ballroom serves as the venue for the event.', '그 호텔 연회장이 행사 장소로 쓰인다.'],
    ['agenda item', '명사구', '안건', 'The budget review is the first agenda item.', '예산 검토가 첫 번째 안건이다.'],
    ['RSVP by the deadline', '구동사', '마감일까지 참석 여부를 알리다', 'Guests are asked to RSVP by the deadline.', '손님들은 마감일까지 참석 여부를 알려 달라는 요청을 받는다.'],
    ['host a workshop', '구동사', '워크숍을 주최하다', 'The department will host a workshop on new software.', '그 부서는 새 소프트웨어에 관한 워크숍을 주최할 것이다.'],
    ['networking opportunity', '명사구', '인맥 형성 기회', 'The dinner provides a great networking opportunity.', '그 만찬은 훌륭한 인맥 형성 기회를 제공한다.'],
    ['award ceremony', '명사구', '시상식', 'The award ceremony will be held next Friday.', '시상식은 다음 주 금요일에 열릴 것이다.'],
    ['refreshments will be served', '구동사', '다과가 제공되다', 'Light refreshments will be served after the seminar.', '세미나 후 가벼운 다과가 제공될 것이다.'],
    ['postpone the seminar', '구동사', '세미나를 연기하다', 'Organizers decided to postpone the seminar until next week.', '주최 측은 세미나를 다음 주로 연기하기로 결정했다.'],
    ['panel discussion', '명사구', '패널 토론', 'The panel discussion covered recent industry trends.', '그 패널 토론은 최근 업계 동향을 다루었다.'],
  ]},
  { sec: '08', topic: 't-travel', label: '출장·여행', words: [
    ['book a flight', '구동사', '항공편을 예약하다', 'She booked a flight for the sales trip.', '그녀는 영업 출장을 위해 항공편을 예약했다.'],
    ['frequent flyer', '명사구', '항공사 단골 고객', 'Frequent flyers earn points toward free tickets.', '단골 고객들은 무료 항공권을 위한 포인트를 적립한다.'],
    ['boarding pass', '명사구', '탑승권', 'Please have your boarding pass ready at the gate.', '탑승구에서 탑승권을 준비해 주세요.'],
    ['claim baggage', '구동사', '수하물을 찾다', 'Passengers can claim their baggage at carousel 4.', '승객들은 4번 수하물대에서 짐을 찾을 수 있다.'],
    ['layover', '명사', '경유, 갈아타는 시간', 'The flight has a two-hour layover in Tokyo.', '그 항공편은 도쿄에서 2시간 경유한다.'],
    ['itemize expenses', '구동사', '경비를 항목별로 정리하다', 'Employees must itemize expenses on the report form.', '직원들은 보고서 양식에 경비를 항목별로 정리해야 한다.'],
    ['per diem', '명사구', '일일 출장 수당', 'The company provides a per diem for meals.', '회사는 식비로 일일 수당을 지급한다.'],
    ['travel itinerary', '명사구', '여행 일정', 'The travel itinerary includes three client meetings.', '그 여행 일정에는 세 건의 고객 미팅이 포함되어 있다.'],
    ['confirm a reservation', '구동사', '예약을 확인하다', 'Please call the hotel to confirm your reservation.', '예약 확인을 위해 호텔에 전화해 주세요.'],
    ['expense report', '명사구', '경비 보고서', 'Submit your expense report within a week of your trip.', '출장 후 일주일 이내에 경비 보고서를 제출하세요.'],
    ['complimentary breakfast', '명사구', '무료 조식', 'The hotel offers a complimentary breakfast to guests.', '그 호텔은 투숙객에게 무료 조식을 제공한다.'],
    ['check out of a hotel', '구동사', '호텔에서 체크아웃하다', 'Guests must check out of the hotel by noon.', '투숙객들은 정오까지 호텔에서 체크아웃해야 한다.'],
  ]},
  { sec: '09', topic: 't-facility', label: '시설·유지보수', words: [
    ['under renovation', '형용사구', '보수 공사 중인', 'The lobby is currently under renovation.', '로비는 현재 보수 공사 중이다.'],
    ['routine maintenance', '명사구', '정기 점검', 'The elevator is closed for routine maintenance.', '엘리베이터는 정기 점검으로 인해 폐쇄되었다.'],
    ['malfunctioning equipment', '명사구', '고장 난 장비', 'Report any malfunctioning equipment to the facilities team.', '고장 난 장비는 시설 관리팀에 신고하세요.'],
    ['out of order', '형용사구', '고장 난, 작동하지 않는', 'The photocopier on the third floor is out of order.', '3층 복사기는 고장이 났다.'],
    ['replace a part', '구동사', '부품을 교체하다', 'The technician replaced a faulty part in the printer.', '기술자가 프린터의 고장 난 부품을 교체했다.'],
    ['fire exit', '명사구', '비상구', 'Do not block the fire exit with boxes.', '상자로 비상구를 막지 마세요.'],
    ['comply with safety regulations', '구동사', '안전 규정을 준수하다', 'All contractors must comply with safety regulations.', '모든 계약업체는 안전 규정을 준수해야 한다.'],
    ['inspect the premises', '구동사', '부지를 점검하다', 'An inspector will inspect the premises next Tuesday.', '점검관이 다음 주 화요일에 부지를 점검할 것이다.'],
    ['upgrade the facility', '구동사', '시설을 개선하다', 'The company plans to upgrade the facility this year.', '회사는 올해 시설을 개선할 계획이다.'],
    ['power outage', '명사구', '정전', 'A power outage delayed production for two hours.', '정전으로 생산이 두 시간 지연되었다.'],
    ['structural repair', '명사구', '구조 보수', 'The bridge requires major structural repair.', '그 다리는 대대적인 구조 보수가 필요하다.'],
    ['occupational hazard', '명사구', '직업상의 위험', 'Noise exposure is an occupational hazard in this factory.', '소음 노출은 이 공장의 직업상 위험 요소이다.'],
  ]},
  { sec: '10', topic: 't-contract', label: '계약·법무', words: [
    ['sign a contract', '구동사', '계약서에 서명하다', 'Both parties signed the contract on Monday.', '양측은 월요일에 계약서에 서명했다.'],
    ['terms and conditions', '명사구', '약관, 조건', 'Please read the terms and conditions carefully.', '약관을 주의 깊게 읽어 주세요.'],
    ['breach of contract', '명사구', '계약 위반', 'The supplier was sued for breach of contract.', '그 공급업체는 계약 위반으로 소송을 당했다.'],
    ['non-disclosure agreement', '명사구', '비밀유지계약', 'New employees must sign a non-disclosure agreement.', '신입 사원은 비밀유지계약에 서명해야 한다.'],
    ['renew a lease', '구동사', '임대 계약을 갱신하다', 'The tenant decided to renew the lease for another year.', '세입자는 임대 계약을 1년 더 갱신하기로 결정했다.'],
    ['legally binding', '형용사구', '법적 구속력이 있는', 'The agreement is legally binding once signed.', '그 합의서는 서명되면 법적 구속력을 갖는다.'],
    ['waive a fee', '구동사', '수수료를 면제하다', 'The bank agreed to waive the late fee.', '은행은 연체 수수료를 면제해 주기로 했다.'],
    ['comply with regulations', '구동사', '규정을 준수하다', 'The factory must comply with environmental regulations.', '그 공장은 환경 규정을 준수해야 한다.'],
    ['draft an agreement', '구동사', '계약서 초안을 작성하다', 'The lawyer drafted an agreement for both companies.', '변호사가 양사를 위한 계약서 초안을 작성했다.'],
    ['intellectual property rights', '명사구', '지적 재산권', 'The company protects its intellectual property rights carefully.', '그 회사는 자사의 지적 재산권을 신중하게 보호한다.'],
    ['liability for damages', '명사구', '손해에 대한 책임', 'The contract limits liability for damages.', '그 계약서는 손해에 대한 책임을 제한한다.'],
    ['terminate an agreement', '구동사', '계약을 종료하다', 'Either party may terminate the agreement with written notice.', '어느 한쪽이든 서면 통지로 계약을 종료할 수 있다.'],
  ]},
  { sec: '11', topic: 't-tech', label: 'IT·기술', words: [
    ['upgrade the software', '구동사', '소프트웨어를 업그레이드하다', 'IT staff will upgrade the software this weekend.', 'IT 직원들이 이번 주말에 소프트웨어를 업그레이드할 것이다.'],
    ['troubleshoot an issue', '구동사', '문제를 해결하다', 'The technician helped troubleshoot the network issue.', '기술자가 네트워크 문제 해결을 도왔다.'],
    ['back up the data', '구동사', '데이터를 백업하다', 'Remember to back up the data before the update.', '업데이트 전에 데이터를 백업하는 것을 잊지 마세요.'],
    ['password-protected file', '명사구', '비밀번호로 보호된 파일', 'The report is saved as a password-protected file.', '그 보고서는 비밀번호로 보호된 파일로 저장되어 있다.'],
    ['install an update', '구동사', '업데이트를 설치하다', 'Users are advised to install the update immediately.', '사용자들은 즉시 업데이트를 설치하도록 권장된다.'],
    ['technical support', '명사구', '기술 지원', 'Contact technical support if the error persists.', '오류가 계속되면 기술 지원팀에 문의하세요.'],
    ['network connectivity', '명사구', '네트워크 연결', 'Poor network connectivity delayed the video call.', '불안정한 네트워크 연결로 화상 통화가 지연되었다.'],
    ['restore the system', '구동사', '시스템을 복구하다', 'It took hours to restore the system after the crash.', '시스템 고장 후 복구하는 데 몇 시간이 걸렸다.'],
    ['compatible with', '형용사구', '~와 호환되는', 'The new printer is compatible with most devices.', '그 새 프린터는 대부분의 기기와 호환된다.'],
    ['user interface', '명사구', '사용자 인터페이스', 'The app was redesigned with a simpler user interface.', '그 앱은 더 간단한 사용자 인터페이스로 재설계되었다.'],
    ['glitch in the system', '명사구', '시스템 오류', 'A glitch in the system caused the outage.', '시스템 오류가 서비스 중단을 일으켰다.'],
    ['encrypt sensitive data', '구동사', '민감한 데이터를 암호화하다', 'The company encrypts sensitive data before storage.', '회사는 저장 전에 민감한 데이터를 암호화한다.'],
  ]},
  { sec: '12', topic: 't-adv-adv', label: '강조 부사', words: [
    ['considerably', '부사', '상당히', 'Sales have increased considerably since the launch.', '출시 이후 매출이 상당히 증가했다.'],
    ['markedly', '부사', '현저하게', 'Productivity markedly improved after the new system was introduced.', '새 시스템 도입 후 생산성이 현저하게 향상되었다.'],
    ['substantially', '부사', '상당히, 실질적으로', 'The budget was substantially reduced this year.', '예산이 올해 상당히 축소되었다.'],
    ['notably', '부사', '특히, 눈에 띄게', 'Costs have notably decreased in the past quarter.', '지난 분기에 비용이 눈에 띄게 감소했다.'],
    ['inadvertently', '부사', '무심코, 부주의로', 'The clerk inadvertently sent the invoice to the wrong client.', '직원이 무심코 청구서를 다른 고객에게 보냈다.'],
    ['concurrently', '부사', '동시에', 'The two projects will run concurrently.', '두 프로젝트는 동시에 진행될 것이다.'],
    ['promptly', '부사', '신속히, 즉시', 'Please respond to the client promptly.', '고객에게 신속히 답변해 주세요.'],
    ['inevitably', '부사', '필연적으로', 'Delays are inevitably caused by bad weather.', '악천후로 인해 지연은 필연적으로 발생한다.'],
    ['predominantly', '부사', '주로, 대부분', 'The workforce is predominantly composed of engineers.', '그 인력은 주로 엔지니어들로 구성되어 있다.'],
    ['unanimously', '부사', '만장일치로', 'The board unanimously approved the merger.', '이사회는 만장일치로 합병을 승인했다.'],
    ['reportedly', '부사', '전해지는 바에 따르면', 'The CEO reportedly plans to resign next year.', '전해지는 바에 따르면 CEO는 내년에 사임할 계획이다.'],
    ['collectively', '부사', '집합적으로, 총괄하여', 'The departments collectively decided on the new policy.', '각 부서들이 집합적으로 새 정책을 결정했다.'],
  ]},
  { sec: '13', topic: 't-adv-noun', label: '복합명사', words: [
    ['cost-effectiveness', '명사', '비용 효율성', "The new machine improved the plant's cost-effectiveness.", '새 기계는 공장의 비용 효율성을 향상시켰다.'],
    ['decision-making', '명사', '의사 결정', 'Employees are encouraged to take part in decision-making.', '직원들은 의사 결정에 참여하도록 권장된다.'],
    ['work-life balance', '명사', '일과 삶의 균형', 'The company promotes a healthy work-life balance.', '그 회사는 건강한 일과 삶의 균형을 추구한다.'],
    ['brainstorming session', '명사', '브레인스토밍 회의', 'The team held a brainstorming session to generate ideas.', '팀은 아이디어를 내기 위해 브레인스토밍 회의를 열었다.'],
    ['follow-up call', '명사', '후속 전화', 'A follow-up call will be made within a week.', '일주일 이내에 후속 전화가 걸려올 것이다.'],
    ['start-up costs', '명사', '창업 비용', 'Start-up costs were higher than expected.', '창업 비용이 예상보다 높았다.'],
    ['turnaround time', '명사', '처리 소요 시간', 'The printing service offers a 24-hour turnaround time.', '그 인쇄 서비스는 24시간 처리 소요 시간을 제공한다.'],
    ['customer satisfaction', '명사', '고객 만족도', 'Customer satisfaction improved after the policy change.', '정책 변경 후 고객 만족도가 향상되었다.'],
    ['record-breaking sales', '명사', '기록적인 매출', 'The company posted record-breaking sales this quarter.', '회사는 이번 분기에 기록적인 매출을 기록했다.'],
    ['workforce reduction', '명사', '인력 감축', 'The merger led to a workforce reduction.', '그 합병은 인력 감축으로 이어졌다.'],
    ['quality assurance', '명사', '품질 보증', 'The quality assurance team inspected every unit.', '품질 보증팀이 모든 제품을 검사했다.'],
    ['benchmark analysis', '명사', '기준 분석', 'A benchmark analysis was conducted against competitors.', '경쟁사 대비 기준 분석이 실시되었다.'],
  ]},
  { sec: '14', topic: 't-adv-confuse', label: '헷갈리는 유사어', words: [
    ['economic', '형용사', '경제의', 'The economic outlook remains uncertain.', '경제 전망은 여전히 불확실하다.'],
    ['economical', '형용사', '절약이 되는, 경제적인', 'This model is more economical to operate.', '이 모델은 운영하는 데 더 경제적이다.'],
    ['considerable', '형용사', '상당한', 'The renovation required a considerable amount of time.', '그 보수 공사는 상당한 시간을 필요로 했다.'],
    ['considerate', '형용사', '사려 깊은, 배려하는', 'He was considerate enough to reschedule the meeting.', '그는 회의 일정을 변경할 만큼 사려 깊었다.'],
    ['respectively', '부사', '각각', 'The two branches reported profits of $2M and $3M, respectively.', '두 지점은 각각 2백만 달러와 3백만 달러의 이익을 보고했다.'],
    ['respectfully', '부사', '정중하게', 'Please respond respectfully to all customer complaints.', '모든 고객 불만에 정중하게 응답해 주세요.'],
    ['comprehensive', '형용사', '포괄적인', 'The report provides a comprehensive overview of the market.', '그 보고서는 시장에 대한 포괄적인 개요를 제공한다.'],
    ['comprehensible', '형용사', '이해할 수 있는', 'The instructions were written in a comprehensible manner.', '그 설명서는 이해할 수 있는 방식으로 작성되었다.'],
    ['sensible', '형용사', '분별 있는, 합리적인', 'It is sensible to back up your files regularly.', '파일을 정기적으로 백업하는 것은 합리적이다.'],
    ['sensitive', '형용사', '민감한', 'The documents contain sensitive information.', '그 문서에는 민감한 정보가 포함되어 있다.'],
    ['assure', '동사', '확신시키다, 장담하다', 'The manager assured the client that the delay would not recur.', '매니저는 고객에게 그 지연이 반복되지 않을 것이라고 장담했다.'],
    ['ensure', '동사', '반드시 ~하게 하다, 보장하다', 'Please ensure that all forms are signed.', '모든 양식에 서명이 되었는지 반드시 확인해 주세요.'],
  ]},
];

const ENTRIES = [];
const TOPICS = [];
const TOPIC_OF = {};
const SECTIONS = [];
{
  let idx = 0;
  RAW_SECTIONS.forEach((s) => {
    SECTIONS.push({ id: s.sec, label: s.label });
    TOPICS.push({ id: s.topic, label: s.label });
    s.words.forEach(([term, pos, meaning, ex, tr]) => {
      ENTRIES.push({ i: idx, term, pos, meaning, ex, tr, sec: s.sec });
      TOPIC_OF[idx] = s.topic;
      idx += 1;
    });
  });
}

/* PART 5 빈칸 채우기 — 문법 포인트별 실전 문항 */
const POINTS = [
  { id: 'pos-noun', ko: '명사 자리 찾기' },
  { id: 'pos-adj', ko: '형용사 자리 찾기' },
  { id: 'pos-adv', ko: '부사 자리 찾기' },
  { id: 'tense', ko: '시제 일치' },
  { id: 'voice', ko: '능동태 · 수동태' },
  { id: 'prep-conj', ko: '전치사 vs 접속사' },
  { id: 'relative', ko: '관계대명사' },
  { id: 'agreement', ko: '주어-동사 수 일치' },
];

const P5 = [
  // pos-noun
  { point: 'pos-noun', stem: 'The committee will review the ______ of the proposed merger next week.', choices: ['implicate', 'implication', 'implicated', 'implicative'], answer: 1, explain: 'the 뒤·of 앞은 명사 자리 — implication(영향, 함의)이 정답.', sentence: 'The committee will review the implication of the proposed merger next week.' },
  { point: 'pos-noun', stem: 'Employee ______ has improved since the new incentive program began.', choices: ['produce', 'productive', 'productivity', 'productively'], answer: 2, explain: '문장의 주어 자리이자 명사가 필요한 자리 — productivity(생산성).', sentence: 'Employee productivity has improved since the new incentive program began.' },
  { point: 'pos-noun', stem: 'The manager praised the team for its ______ to the project.', choices: ['contribute', 'contribution', 'contributed', 'contributing'], answer: 1, explain: 'its 뒤 소유격 다음은 명사 자리 — contribution(기여).', sentence: "The manager praised the team for its contribution to the project." },
  { point: 'pos-noun', stem: 'A written ______ is required before any refund can be issued.', choices: ['authorize', 'authorization', 'authorized', 'authorizing'], answer: 1, explain: '관사 A 뒤 형용사 written의 수식을 받는 명사 자리 — authorization(승인).', sentence: 'A written authorization is required before any refund can be issued.' },
  { point: 'pos-noun', stem: 'The new policy aims to reduce the company\'s overall ______.', choices: ['expend', 'expenditure', 'expended', 'expensive'], answer: 1, explain: '소유격 company\'s 뒤 명사 자리 — expenditure(지출).', sentence: "The new policy aims to reduce the company's overall expenditure." },

  // pos-adj
  { point: 'pos-adj', stem: 'The training session was extremely ______ for new hires.', choices: ['benefit', 'benefits', 'beneficial', 'beneficially'], answer: 2, explain: 'be동사 뒤 보어 자리 — 형용사 beneficial(유익한)이 정답.', sentence: 'The training session was extremely beneficial for new hires.' },
  { point: 'pos-adj', stem: 'All applicants must provide ______ references from previous employers.', choices: ['verify', 'verifiable', 'verification', 'verifiably'], answer: 1, explain: '명사 references를 앞에서 수식하는 형용사 자리 — verifiable(확인 가능한).', sentence: 'All applicants must provide verifiable references from previous employers.' },
  { point: 'pos-adj', stem: 'The revised schedule seems more ______ than the original one.', choices: ['practical', 'practice', 'practicality', 'practically'], answer: 0, explain: 'more 뒤 형용사 비교급 자리 — practical(실용적인).', sentence: 'The revised schedule seems more practical than the original one.' },
  { point: 'pos-adj', stem: 'The device remains fully ______ even after years of daily use.', choices: ['function', 'functional', 'functionality', 'functionally'], answer: 1, explain: 'remains 뒤 형용사 보어 자리 — functional(기능하는, 작동하는).', sentence: 'The device remains fully functional even after years of daily use.' },
  { point: 'pos-adj', stem: 'It is ______ that all staff attend the safety briefing.', choices: ['mandate', 'mandatory', 'mandatorily', 'mandating'], answer: 1, explain: 'It is 뒤 형용사 보어 자리 — mandatory(의무적인).', sentence: 'It is mandatory that all staff attend the safety briefing.' },

  // pos-adv
  { point: 'pos-adv', stem: 'The proposal was ______ rejected by the board members.', choices: ['unanimous', 'unanimity', 'unanimously', 'unanimousness'], answer: 2, explain: '동사 rejected를 수식하는 부사 자리 — unanimously(만장일치로).', sentence: 'The proposal was unanimously rejected by the board members.' },
  { point: 'pos-adv', stem: 'Please complete the survey ______ before the end of the month.', choices: ['prompt', 'prompted', 'promptly', 'promptness'], answer: 2, explain: '동사구를 수식하는 부사 자리 — promptly(신속히).', sentence: 'Please complete the survey promptly before the end of the month.' },
  { point: 'pos-adv', stem: 'The two departments worked ______ to finish the audit on time.', choices: ['close', 'closely', 'closer', 'closeness'], answer: 1, explain: '동사 worked를 수식하는 부사 자리 — closely(긴밀히).', sentence: 'The two departments worked closely to finish the audit on time.' },
  { point: 'pos-adv', stem: 'The new hires performed ______ well during their first week.', choices: ['remark', 'remarkable', 'remarkably', 'remarked'], answer: 2, explain: '형용사 well을 수식하는 부사 자리 — remarkably(눈에 띄게).', sentence: 'The new hires performed remarkably well during their first week.' },
  { point: 'pos-adv', stem: 'Management ______ agreed to extend the project deadline.', choices: ['reluctant', 'reluctance', 'reluctantly', 'reluctantness'], answer: 2, explain: '동사 agreed를 수식하는 부사 자리 — reluctantly(마지못해).', sentence: 'Management reluctantly agreed to extend the project deadline.' },

  // tense
  { point: 'tense', stem: 'By the time the auditor arrives next week, the report ______.', choices: ['will complete', 'will have completed', 'completed', 'completes'], answer: 1, explain: '미래의 특정 시점보다 앞서 끝나는 일 — 미래완료(will have completed).', sentence: 'By the time the auditor arrives next week, the report will have completed.' },
  { point: 'tense', stem: 'The company ______ its headquarters twice in the last decade.', choices: ['relocates', 'relocated', 'has relocated', 'will relocate'], answer: 2, explain: '기간(in the last decade)과 함께 쓰이는 현재완료 — has relocated.', sentence: 'The company has relocated its headquarters twice in the last decade.' },
  { point: 'tense', stem: 'While the technician ______ the printer, the office lost power.', choices: ['repairs', 'was repairing', 'repaired', 'has repaired'], answer: 1, explain: '과거 진행 중이던 동작(While) — was repairing(과거진행).', sentence: 'While the technician was repairing the printer, the office lost power.' },
  { point: 'tense', stem: 'The new regulations ______ into effect as soon as they are approved.', choices: ['go', 'went', 'will go', 'had gone'], answer: 2, explain: 'as soon as 이하가 미래를 나타내면 주절은 미래시제 — will go.', sentence: 'The new regulations will go into effect as soon as they are approved.' },
  { point: 'tense', stem: 'Since joining the firm, she ______ three major clients.', choices: ['manages', 'managed', 'has managed', 'will manage'], answer: 2, explain: 'Since와 함께 쓰이는 현재완료 — has managed.', sentence: 'Since joining the firm, she has managed three major clients.' },

  // voice
  { point: 'voice', stem: 'The annual report ______ by the finance team every January.', choices: ['prepares', 'is prepared', 'prepared', 'has prepared'], answer: 1, explain: '주어(report)가 준비되는 대상 — 수동태 is prepared.', sentence: 'The annual report is prepared by the finance team every January.' },
  { point: 'voice', stem: 'The new policy ______ to all employees before it takes effect.', choices: ['will explain', 'will be explained', 'explains', 'explained'], answer: 1, explain: '정책(policy)이 설명되는 대상 — 수동태 will be explained.', sentence: 'The new policy will be explained to all employees before it takes effect.' },
  { point: 'voice', stem: 'The manager ______ the budget proposal at yesterday\'s meeting.', choices: ['was presented', 'presented', 'is presented', 'presents'], answer: 1, explain: 'the manager가 직접 행한 동작 — 능동태 presented.', sentence: "The manager presented the budget proposal at yesterday's meeting." },
  { point: 'voice', stem: 'All applications ______ carefully before the interviews are scheduled.', choices: ['review', 'reviewed', 'are reviewed', 'reviewing'], answer: 2, explain: 'applications가 검토되는 대상 — 수동태 are reviewed.', sentence: 'All applications are reviewed carefully before the interviews are scheduled.' },
  { point: 'voice', stem: 'The conference room ______ for the client meeting this afternoon.', choices: ['reserves', 'has reserved', 'has been reserved', 'reserving'], answer: 2, explain: 'room이 예약되는 대상 — 현재완료 수동태 has been reserved.', sentence: 'The conference room has been reserved for the client meeting this afternoon.' },

  // prep-conj
  { point: 'prep-conj', stem: '______ the heavy rain, the outdoor event proceeded as planned.', choices: ['Although', 'Despite', 'Because', 'Unless'], answer: 1, explain: '뒤에 명사구(the heavy rain)가 오므로 전치사 Despite가 정답.', sentence: 'Despite the heavy rain, the outdoor event proceeded as planned.' },
  { point: 'prep-conj', stem: '______ the shipment arrives late, customers will be notified immediately.', choices: ['In case of', 'If', 'Due to', 'Because of'], answer: 1, explain: '뒤에 절(주어+동사)이 오므로 접속사 If가 정답.', sentence: 'If the shipment arrives late, customers will be notified immediately.' },
  { point: 'prep-conj', stem: 'The meeting was postponed ______ a scheduling conflict.', choices: ['because', 'due to', 'although', 'while'], answer: 1, explain: '뒤에 명사구가 오므로 전치사구 due to가 정답.', sentence: 'The meeting was postponed due to a scheduling conflict.' },
  { point: 'prep-conj', stem: '______ the report is finished, please send it to legal for review.', choices: ['Once', 'Despite', 'During', 'For'], answer: 0, explain: '뒤에 절이 오므로 접속사 Once(~하자마자)가 정답.', sentence: 'Once the report is finished, please send it to legal for review.' },
  { point: 'prep-conj', stem: 'The factory remained open ______ the holiday season.', choices: ['while', 'throughout', 'even though', 'unless'], answer: 1, explain: '뒤에 명사구(the holiday season)가 오므로 전치사 throughout이 정답.', sentence: 'The factory remained open throughout the holiday season.' },

  // relative
  { point: 'relative', stem: 'The engineer ______ designed the system will lead the training.', choices: ['who', 'whom', 'whose', 'which'], answer: 0, explain: '선행사 the engineer(사람)를 받는 주격 관계대명사 — who.', sentence: 'The engineer who designed the system will lead the training.' },
  { point: 'relative', stem: 'The proposal, ______ details were unclear, was sent back for revision.', choices: ['who', 'that', 'whose', 'which'], answer: 2, explain: '선행사(the proposal)와 details가 소유 관계 — 소유격 관계대명사 whose.', sentence: 'The proposal, whose details were unclear, was sent back for revision.' },
  { point: 'relative', stem: 'This is the invoice ______ the client disputed last month.', choices: ['who', 'which', 'whose', 'where'], answer: 1, explain: '선행사 the invoice(사물)를 받는 목적격 관계대명사 — which.', sentence: 'This is the invoice which the client disputed last month.' },
  { point: 'relative', stem: 'Employees ______ badges are lost must report to security immediately.', choices: ['who', 'whom', 'whose', 'which'], answer: 2, explain: 'Employees와 badges의 소유 관계 — 소유격 관계대명사 whose.', sentence: 'Employees whose badges are lost must report to security immediately.' },
  { point: 'relative', stem: 'The branch ______ we visited last year has since closed.', choices: ['who', 'whom', 'which', 'whose'], answer: 2, explain: '선행사 the branch(사물)를 받는 목적격 관계대명사 — which.', sentence: 'The branch which we visited last year has since closed.' },

  // agreement
  { point: 'agreement', stem: 'Each of the applicants ______ required to complete a written test.', choices: ['is', 'are', 'were', 'have been'], answer: 0, explain: "Each of + 복수명사'라도 주어는 단수 취급 — is.", sentence: 'Each of the applicants is required to complete a written test.' },
  { point: 'agreement', stem: 'The number of complaints ______ increased significantly this month.', choices: ['have', 'has', 'were', 'are'], answer: 1, explain: "'The number of + 복수명사'는 단수 취급 — has.", sentence: 'The number of complaints has increased significantly this month.' },
  { point: 'agreement', stem: 'Neither the manager nor the employees ______ aware of the change.', choices: ['was', 'is', 'were', 'has been'], answer: 2, explain: 'Neither A nor B는 B(employees, 복수)에 동사 수 일치 — were.', sentence: 'Neither the manager nor the employees were aware of the change.' },
  { point: 'agreement', stem: 'A number of clients ______ expressed interest in the new service.', choices: ['has', 'have', 'is', 'was'], answer: 1, explain: "'A number of + 복수명사'는 복수 취급 — have.", sentence: 'A number of clients have expressed interest in the new service.' },
  { point: 'agreement', stem: 'Everyone in the department ______ invited to the year-end party.', choices: ['is', 'are', 'were', 'have been'], answer: 0, explain: 'Everyone은 단수 취급 — is.', sentence: 'Everyone in the department is invited to the year-end party.' },
];

if (typeof window !== 'undefined') {
  Object.assign(window, { ENTRIES, SECTIONS, TOPICS, TOPIC_OF, P5, POINTS });
}

/*
 * finecode-data.js — 파인코드 스터디 내용
 *
 * 화면에 보이는 항목은 전부 이 파일에 있다. 새 회차는 sessions 배열 끝에 추가한다.
 *
 * 항목 하나의 모양
 *   id     회차 안에서 겹치지 않는 값 (l1, l2, ...). 체크 저장에 쓰이므로 한번 정하면 바꾸지 않는다.
 *   short  목차 칩에 쓰는 짧은 이름
 *   title  제목            (HTML 조각 가능)
 *   ver    제목 옆 작은 표시. 없어도 된다.
 *   why    한두 문장 설명   (HTML 조각 가능: <code>, <strong>)
 *   bad    나쁜 예 코드     (순수 자바 코드. 색칠과 < > 처리는 finecode-check.js 가 한다)
 *   good   좋은 예 코드
 *   single { label, code }  좌우 비교 없이 한 칸으로 보여 줄 때 bad/good 대신 쓴다.
 *   note   보충 설명. 없어도 된다. (HTML 조각 가능)
 *   lang   자바가 아닌 코드(설정, 명령어, SQL 등)면 'plain'. 한 칸만 그렇다면 { good: 'plain' } 처럼 쓴다.
 *   badLabel, goodLabel  칸 제목을 바꿀 때 쓴다. 없으면 나쁨 / 좋음.
 *
 * 코드는 String.raw`...` 안에 그대로 쓴다. 역슬래시(\n 등)도 그대로 쓰면 된다.
 * 단, 코드 안에 백틱은 쓸 수 없고, 달러-중괄호는 앞에 역슬래시를 붙여 쓴다 (화면에서는 역슬래시가 빠진다).
 */
window.FINECODE = {
  subject: `Java`,
  sessions: [
    {
      id: 'java-1', no: 1, name: `기본 습관`,
      lead: `매일 손에 붙여야 할 자바 코드 습관입니다. 왼쪽은 흔히 쓰는 나쁜 예, 오른쪽은 고쳐 쓴 좋은 예입니다.`,
      lessons: [
        {
          id: 'l1', short: `상수`,
          title: `매직 넘버 대신 상수`,
          why: `숫자의 의미가 이름에 드러나고, 바꿀 때 고칠 곳이 한 군데가 됩니다.`,
          bad: String.raw`
if (age >= 19) { ... }
`,
          good: String.raw`
private static final int ADULT_AGE = 19;

if (age >= ADULT_AGE) { ... }
`,
        },
        {
          id: 'l2', short: `equals`,
          title: `문자열 비교는 equals`,
          why: `<code>==</code>는 같은 객체인지만 봅니다. 내용 비교는 반드시 equals를 씁니다.`,
          bad: String.raw`
if (name == "kim") { ... }
`,
          good: String.raw`
if ("kim".equals(name)) { ... }
// name이 null이어도 안전
`,
        },
        {
          id: 'l3', short: `StringBuilder`,
          title: `문자열 반복 연결은 StringBuilder`,
          why: `String은 불변이라 += 할 때마다 새 객체가 생깁니다. 반복문 안에서는 StringBuilder를 씁니다.`,
          bad: String.raw`
String s = "";
for (int i = 0; i < 1000; i++) {
    s += i;  // 매번 새 String
}
`,
          good: String.raw`
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 1000; i++) {
    sb.append(i);
}
String s = sb.toString();
`,
        },
        {
          id: 'l4', short: `null 대신`,
          title: `null 반환 대신 빈 컬렉션 또는 Optional`,
          why: `호출하는 쪽이 null 체크를 빼먹어 터지는 NullPointerException을 원천 차단합니다.`,
          bad: String.raw`
public List<User> findUsers() {
    return null;
}
`,
          good: String.raw`
public List<User> findUsers() {
    return Collections.emptyList();
}

public Optional<User> findById(long id) {
    return Optional.ofNullable(repo.get(id));
}
`,
        },
        {
          id: 'l5', short: `try-with-resources`,
          title: `자원은 try-with-resources`,
          why: `예외가 나도 close()가 자동으로 호출됩니다. 파일, 소켓, DB 커넥션 모두 해당됩니다.`,
          bad: String.raw`
BufferedReader br =
    new BufferedReader(new FileReader("a.txt"));
String line = br.readLine();
br.close();  // 예외 발생 시 close 안 됨
`,
          good: String.raw`
try (BufferedReader br =
        new BufferedReader(new FileReader("a.txt"))) {
    String line = br.readLine();
}
`,
        },
        {
          id: 'l6', short: `인터페이스 타입`,
          title: `인터페이스 타입으로 선언`,
          why: `나중에 LinkedList나 불변 리스트로 바꿔도 선언부와 호출부를 고칠 필요가 없습니다.`,
          bad: String.raw`
ArrayList<String> list = new ArrayList<>();
`,
          good: String.raw`
List<String> list = new ArrayList<>();
`,
        },
        {
          id: 'l7', short: `early return`,
          title: `조건문 중첩 대신 early return`,
          why: `예외 상황을 먼저 걸러내면 정상 흐름이 한눈에 읽히고 들여쓰기가 얕아집니다.`,
          bad: String.raw`
public String grade(int score) {
    if (score >= 0) {
        if (score >= 90) {
            return "A";
        } else {
            return "B";
        }
    } else {
        throw new IllegalArgumentException();
    }
}
`,
          good: String.raw`
public String grade(int score) {
    if (score < 0) {
        throw new IllegalArgumentException("score < 0");
    }
    if (score >= 90) return "A";
    return "B";
}
`,
        },
        {
          id: 'l8', short: `불변 객체`,
          title: `불변 객체 선호`,
          why: `final 필드에 세터가 없으면 멀티스레드에서 안전하고, 상태가 몰래 바뀌는 버그가 사라집니다.`,
          single: { label: `불변 클래스`, code: String.raw`
public final class Money {
    private final long amount;

    public Money(long amount) { this.amount = amount; }

    public Money plus(Money other) {
        return new Money(this.amount + other.amount);  // 새 객체 반환
    }

    public long amount() { return amount; }
}
` },
          note: `<strong>Java 16 이상</strong>이라면 <code>record Money(long amount) {}</code> 한 줄로 끝납니다.`,
        },
        {
          id: 'l9', short: `예외 처리`,
          title: `예외는 구체적으로, 삼키지 않기`,
          why: `빈 catch는 버그를 숨깁니다. 잡을 예외를 좁히고, 다시 던질 때는 원인(cause)을 붙입니다.`,
          bad: String.raw`
try {
    ...
} catch (Exception e) {
    // 아무것도 안 함
}
`,
          good: String.raw`
try {
    ...
} catch (IOException e) {
    throw new UncheckedIOException(
        "설정 파일 읽기 실패: " + path, e);  // 원인 보존
}
`,
        },
        {
          id: 'l10', short: `스트림`,
          title: `읽기 쉬울 때는 스트림`,
          why: `필터·변환·수집이 한 줄씩 읽힙니다. 로직이 복잡하거나 디버깅이 필요하면 일반 for문이 낫습니다.`,
          bad: String.raw`
List<String> names = new ArrayList<>();
for (User u : users) {
    if (u.isActive()) {
        names.add(u.getName());
    }
}
`,
          good: String.raw`
List<String> names = users.stream()
        .filter(User::isActive)
        .map(User::getName)
        .toList();
`,
        },
      ],
    },
    {
      id: 'java-2', no: 2, name: `객체 설계`,
      lead: `클래스를 어떻게 만들고 서로 어떻게 엮을지에 관한 습관입니다. 1회차와 같이 왼쪽은 나쁜 예, 오른쪽은 고쳐 쓴 좋은 예입니다.`,
      lessons: [
        {
          id: 'l1', short: `equals/hashCode`,
          title: `equals와 hashCode는 함께 재정의`,
          why: `equals만 바꾸면 HashSet, HashMap에서 같은 객체를 다른 것으로 취급합니다. 둘은 항상 한 쌍입니다.`,
          bad: String.raw`
public class Point {
    int x, y;

    @Override public boolean equals(Object o) {
        if (!(o instanceof Point p)) return false;
        return x == p.x && y == p.y;
    }
    // hashCode 없음 → Set에 중복 저장됨
}
`,
          good: String.raw`
public class Point {
    private final int x, y;

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Point p)) return false;
        return x == p.x && y == p.y;
    }
    @Override public int hashCode() {
        return Objects.hash(x, y);
    }
}
`,
          note: `<strong>record</strong>를 쓰면 equals, hashCode, toString이 자동으로 생성됩니다. 값 객체라면 record가 1순위입니다.`,
        },
        {
          id: 'l2', short: `정적 팩토리`,
          title: `생성자 대신 정적 팩토리 메서드`,
          why: `이름으로 의도를 드러낼 수 있고, 캐싱이나 하위 타입 반환도 가능합니다.`,
          bad: String.raw`
// 두 생성자의 차이를 호출부에서 알 수 없음
Order o1 = new Order(user, items, true);
Order o2 = new Order(user, items, false);
`,
          good: String.raw`
public class Order {
    private Order(...) { ... }

    public static Order express(User u, List<Item> items) {
        return new Order(u, items, true);
    }
    public static Order standard(User u, List<Item> items) {
        return new Order(u, items, false);
    }
}

Order o1 = Order.express(user, items);
`,
        },
        {
          id: 'l3', short: `빌더`,
          title: `매개변수가 많으면 빌더 패턴`,
          why: `같은 타입 인자가 줄지어 있으면 순서를 바꿔 넣어도 컴파일이 됩니다. 빌더는 이름으로 값을 넣습니다.`,
          bad: String.raw`
// 뭐가 뭔지 알 수 없는 인자 나열
Pizza p = new Pizza("L", true, false, true, 2, null);
`,
          good: String.raw`
Pizza p = Pizza.builder()
        .size("L")
        .cheese(true)
        .pepperoni(true)
        .extraCount(2)
        .build();
`,
          note: `직접 구현하면 코드가 길어지므로 실무에서는 <strong>Lombok의 @Builder</strong>를 많이 씁니다.`,
        },
        {
          id: 'l4', short: `enum`,
          title: `상수 문자열 대신 enum`,
          why: `오타를 컴파일러가 잡아주고, switch에서 빠진 케이스를 경고합니다. 동작까지 enum 안에 넣을 수 있습니다.`,
          bad: String.raw`
public static final String STATUS_PAID = "PAID";
public static final String STATUS_CANCELED = "CANCELED";

if (order.getStatus().equals("PIAD")) { ... }  // 오타, 런타임까지 모름
`,
          good: String.raw`
public enum OrderStatus {
    PAID("결제완료"), CANCELED("취소");

    private final String label;
    OrderStatus(String label) { this.label = label; }
    public String label() { return label; }
}

if (order.getStatus() == OrderStatus.PAID) { ... }
`,
        },
        {
          id: 'l5', short: `상속보다 조합`,
          title: `상속보다 조합`,
          why: `부모 클래스의 내부 구현이 바뀌면 자식이 깨집니다. 필요한 객체를 필드로 가지고 위임하면 안전합니다.`,
          bad: String.raw`
public class CountingSet<E> extends HashSet<E> {
    private int added = 0;

    @Override public boolean add(E e) {
        added++;
        return super.add(e);
    }
    @Override public boolean addAll(Collection<? extends E> c) {
        added += c.size();
        return super.addAll(c);  // 내부에서 add()를 또 호출 → 이중 집계
    }
}
`,
          good: String.raw`
public class CountingSet<E> {
    private final Set<E> set = new HashSet<>();
    private int added = 0;

    public boolean add(E e) {
        added++;
        return set.add(e);
    }
    public boolean addAll(Collection<? extends E> c) {
        boolean changed = false;
        for (E e : c) changed |= add(e);
        return changed;
    }
}
`,
        },
        {
          id: 'l6', short: `캡슐화`,
          title: `캡슐화: 내부 컬렉션을 그대로 내주지 않기`,
          why: `getter가 내부 리스트를 반환하면 외부에서 마음대로 추가·삭제할 수 있습니다. 불변 뷰나 복사본을 줍니다.`,
          bad: String.raw`
public class Cart {
    private final List<Item> items = new ArrayList<>();

    public List<Item> getItems() {
        return items;  // 외부에서 items.clear() 가능
    }
}
`,
          good: String.raw`
public class Cart {
    private final List<Item> items = new ArrayList<>();

    public List<Item> getItems() {
        return Collections.unmodifiableList(items);
    }
    public void add(Item item) {   // 변경은 메서드로만
        items.add(item);
    }
}
`,
        },
        {
          id: 'l7', short: `의존성 주입`,
          title: `의존성은 밖에서 주입`,
          why: `클래스 안에서 new로 만들면 테스트할 때 바꿔 끼울 수 없습니다. 생성자로 받으면 가짜 객체를 넣어 테스트할 수 있습니다.`,
          bad: String.raw`
public class OrderService {
    private final PaymentGateway gateway = new TossGateway();

    public void pay(Order o) {
        gateway.charge(o.total());  // 테스트하면 실제 결제됨
    }
}
`,
          good: String.raw`
public class OrderService {
    private final PaymentGateway gateway;

    public OrderService(PaymentGateway gateway) {
        this.gateway = gateway;
    }
    public void pay(Order o) {
        gateway.charge(o.total());
    }
}

// 테스트
new OrderService(new FakeGateway()).pay(order);
`,
          note: `스프링의 <strong>@Autowired 생성자 주입</strong>이 바로 이 패턴입니다. 필드 주입보다 생성자 주입을 권장하는 이유이기도 합니다.`,
        },
        {
          id: 'l8', short: `제네릭`,
          title: `로 타입 대신 제네릭`,
          why: `제네릭 없이 쓰면 꺼낼 때마다 캐스팅해야 하고, 잘못 넣어도 컴파일이 됩니다.`,
          bad: String.raw`
List names = new ArrayList();
names.add("kim");
names.add(42);                        // 통과됨
String first = (String) names.get(1); // 런타임 ClassCastException
`,
          good: String.raw`
List<String> names = new ArrayList<>();
names.add("kim");
names.add(42);                 // 컴파일 오류
String first = names.get(0);   // 캐스팅 불필요

// 직접 만들 때도 타입 매개변수를
public class Box<T> {
    private T value;
    public T get() { return value; }
}
`,
        },
        {
          id: 'l9', short: `동시성`,
          title: `동시성: 공유 상태는 안전한 도구로`,
          why: `여러 스레드가 같은 변수를 건드리면 값이 사라집니다. Atomic 타입과 Concurrent 컬렉션이 기본 도구입니다.`,
          bad: String.raw`
private int count = 0;
private Map<String, Integer> hits = new HashMap<>();

public void hit(String key) {
    count++;                          // 읽기·더하기·쓰기 3단계, 중간에 끼어듦
    hits.merge(key, 1, Integer::sum); // HashMap은 스레드 안전하지 않음
}
`,
          good: String.raw`
private final AtomicInteger count = new AtomicInteger();
private final Map<String, Integer> hits = new ConcurrentHashMap<>();

public void hit(String key) {
    count.incrementAndGet();
    hits.merge(key, 1, Integer::sum);
}
`,
          note: `가장 좋은 방법은 <strong>공유 상태를 만들지 않는 것</strong>입니다. 불변 객체(1회차 08번)를 쓰면 동기화 자체가 필요 없습니다.`,
        },
        {
          id: 'l10', short: `로깅`,
          title: `System.out 대신 로거`,
          why: `로거는 레벨로 켜고 끌 수 있고, 파일·시간·스레드 정보가 함께 남습니다. 문자열 연결 대신 {} 자리표시자를 씁니다.`,
          bad: String.raw`
System.out.println("user=" + user + " 로그인");

try { ... } catch (Exception e) {
    e.printStackTrace();  // 로그 파일에 안 남음
}
`,
          good: String.raw`
private static final Logger log =
        LoggerFactory.getLogger(LoginService.class);

log.info("user={} 로그인", user.getId());  // 레벨 꺼져 있으면 문자열 생성 안 함

try { ... } catch (IOException e) {
    log.error("파일 처리 실패 path={}", path, e);  // 예외는 마지막 인자로
}
`,
        },
      ],
    },
    {
      id: 'java-3', no: 3, name: `모던 자바 문법`,
      lead: `Java 8 이후에 들어온 문법으로 같은 일을 더 짧고 안전하게 쓰는 방법입니다. 제목 옆 숫자는 그 문법을 쓸 수 있는 최소 자바 버전입니다.`,
      lessons: [
        {
          id: 'l1', short: `Optional`,
          title: `Optional은 꺼내지 말고 이어 쓰기`,
          ver: `Java 8+`,
          why: `isPresent로 확인하고 get으로 꺼내면 null 체크와 다를 게 없습니다. map과 orElse로 이어 쓰면 분기가 사라집니다.`,
          bad: String.raw`
Optional<User> user = findById(id);
if (user.isPresent()) {
    return user.get().getName();
} else {
    return "익명";
}

String name = findById(id).get().getName();  // 비어 있으면 예외
`,
          good: String.raw`
return findById(id)
        .map(User::getName)
        .orElse("익명");

// 없으면 안 되는 경우는 의미 있는 예외로
User user = findById(id)
        .orElseThrow(() -> new UserNotFoundException(id));
`,
          note: `Optional은 <strong>메서드 반환 타입에만</strong> 씁니다. 필드나 매개변수 타입으로 쓰면 오히려 코드가 복잡해집니다.`,
        },
        {
          id: 'l2', short: `record · sealed`,
          title: `값 객체는 record, 닫힌 계층은 sealed`,
          ver: `Java 17+`,
          why: `record는 생성자, 접근자, equals, hashCode, toString을 자동으로 만듭니다. sealed는 구현체 목록을 컴파일러가 알게 해 줍니다.`,
          bad: String.raw`
public class Point {
    private final int x;
    private final int y;

    public Point(int x, int y) { this.x = x; this.y = y; }
    public int getX() { return x; }
    public int getY() { return y; }
    // equals, hashCode, toString 30줄 더...
}
`,
          good: String.raw`
public record Point(int x, int y) {}

// 구현체를 Circle, Square 두 개로 제한
public sealed interface Shape permits Circle, Square {}
public record Circle(double radius) implements Shape {}
public record Square(double side) implements Shape {}

Point p = new Point(1, 2);
p.x();  // 접근자는 getX()가 아니라 x()
`,
        },
        {
          id: 'l3', short: `switch 표현식`,
          title: `switch 표현식과 패턴 매칭`,
          ver: `Java 14+ / 21+`,
          why: `화살표 switch는 break를 빼먹을 일이 없고 값을 바로 돌려줍니다. Java 21부터는 타입으로도 분기할 수 있습니다.`,
          bad: String.raw`
String label;
switch (day) {
    case SAT:
    case SUN:
        label = "주말";
        break;
    default:
        label = "평일";
}

double area;
if (shape instanceof Circle) {
    Circle c = (Circle) shape;
    area = Math.PI * c.radius() * c.radius();
} else { ... }
`,
          good: String.raw`
String label = switch (day) {
    case SAT, SUN -> "주말";
    default -> "평일";
};

// Java 21: 타입으로 분기, 캐스팅 불필요
double area = switch (shape) {
    case Circle c -> Math.PI * c.radius() * c.radius();
    case Square s -> s.side() * s.side();
};  // sealed라서 default 없이도 컴파일됨
`,
          note: `02번의 sealed와 함께 쓰면, 나중에 <strong>구현체를 추가했을 때 빠진 case를 컴파일러가 알려 줍니다.</strong>`,
        },
        {
          id: 'l4', short: `var`,
          title: `var는 타입이 눈에 보일 때만`,
          ver: `Java 10+`,
          why: `오른쪽에 타입이 이미 적혀 있으면 var로 중복을 줄입니다. 메서드 반환값처럼 타입이 안 보이면 명시합니다.`,
          bad: String.raw`
var result = service.process(data);  // 무슨 타입?
var list = new ArrayList<>();        // ArrayList<Object>가 됨
var x = 10L;                         // int인지 long인지 헷갈림
`,
          good: String.raw`
var users = new ArrayList<User>();
var reader = Files.newBufferedReader(path);
for (var entry : priceByName.entrySet()) { ... }

OrderResult result = service.process(data);  // 안 보이면 명시
`,
          note: `var는 <strong>지역 변수에만</strong> 쓸 수 있습니다. 필드, 매개변수, 반환 타입에는 쓸 수 없습니다.`,
        },
        {
          id: 'l5', short: `java.time`,
          title: `Date, Calendar 대신 java.time`,
          ver: `Java 8+`,
          why: `옛 API는 값이 바뀌고, 월이 0부터 시작하고, 포매터가 스레드에 안전하지 않습니다. java.time은 전부 불변입니다.`,
          bad: String.raw`
Calendar cal = Calendar.getInstance();
cal.set(2026, 11, 25);          // 11이 12월
cal.add(Calendar.DATE, 7);
Date due = cal.getTime();

SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
String text = sdf.format(due);  // 여러 스레드가 공유하면 깨짐
`,
          good: String.raw`
LocalDate start = LocalDate.of(2026, 12, 25);
LocalDate due = start.plusDays(7);  // 새 객체 반환

String text = due.format(DateTimeFormatter.ISO_LOCAL_DATE);
long days = ChronoUnit.DAYS.between(start, due);

// 시간까지 필요하면 LocalDateTime, 시간대까지면 ZonedDateTime
LocalDateTime now = LocalDateTime.now();
`,
        },
        {
          id: 'l6', short: `텍스트 블록`,
          title: `여러 줄 문자열은 텍스트 블록`,
          ver: `Java 15+`,
          why: `따옴표 이스케이프와 줄바꿈 기호가 사라져서 JSON, SQL, HTML을 보이는 그대로 쓸 수 있습니다.`,
          bad: String.raw`
String json = "{\n" +
              "  \"name\": \"kim\",\n" +
              "  \"age\": 20\n" +
              "}";

String sql = "SELECT id, name " +
             "FROM users " +
             "WHERE status = ?";
`,
          good: String.raw`
String json = """
        {
          "name": "%s",
          "age": %d
        }
        """.formatted(name, age);

String sql = """
        SELECT id, name
        FROM users
        WHERE status = ?
        """;
`,
          note: `SQL에 값을 넣을 때는 formatted가 아니라 <strong>? 자리표시자와 PreparedStatement</strong>를 씁니다. 문자열로 끼워 넣으면 SQL 인젝션 위험이 생깁니다.`,
        },
        {
          id: 'l7', short: `List.of · Map.of`,
          title: `고정된 컬렉션은 List.of, Map.of`,
          ver: `Java 9+`,
          why: `한 줄로 만들 수 있고 수정이 불가능해서 실수로 바뀔 일이 없습니다.`,
          bad: String.raw`
List<String> roles = new ArrayList<>();
roles.add("ADMIN");
roles.add("USER");

Map<String, Integer> price = new HashMap<>();
price.put("coffee", 4500);
price.put("tea", 4000);
`,
          good: String.raw`
List<String> roles = List.of("ADMIN", "USER");

Map<String, Integer> price = Map.of(
        "coffee", 4500,
        "tea", 4000);

// 받은 컬렉션을 안전하게 보관할 때
this.items = List.copyOf(items);
`,
          note: `add나 put을 호출하면 <strong>UnsupportedOperationException</strong>이 납니다. null도 넣을 수 없습니다.`,
        },
        {
          id: 'l8', short: `groupingBy`,
          title: `묶어서 세기는 groupingBy`,
          ver: `Java 8+`,
          why: `"키가 있으면 꺼내고 없으면 만들고"를 직접 쓰지 않아도 됩니다. 묶은 뒤 개수나 합계까지 한 번에 구합니다.`,
          bad: String.raw`
Map<String, List<Employee>> byDept = new HashMap<>();
for (Employee e : employees) {
    if (!byDept.containsKey(e.getDept())) {
        byDept.put(e.getDept(), new ArrayList<>());
    }
    byDept.get(e.getDept()).add(e);
}
`,
          good: String.raw`
Map<String, List<Employee>> byDept = employees.stream()
        .collect(Collectors.groupingBy(Employee::getDept));

// 부서별 인원 수
Map<String, Long> countByDept = employees.stream()
        .collect(Collectors.groupingBy(
                Employee::getDept, Collectors.counting()));

// 부서별 급여 합계
Map<String, Integer> payByDept = employees.stream()
        .collect(Collectors.groupingBy(
                Employee::getDept,
                Collectors.summingInt(Employee::getSalary)));
`,
        },
        {
          id: 'l9', short: `람다`,
          title: `익명 클래스 대신 람다와 메서드 참조`,
          ver: `Java 8+`,
          why: `메서드 하나짜리 인터페이스는 람다로 씁니다. 조건이나 변환을 받을 때는 표준 함수형 인터페이스를 재사용합니다.`,
          bad: String.raw`
users.sort(new Comparator<User>() {
    @Override
    public int compare(User a, User b) {
        return a.getAge() - b.getAge();  // 오버플로 위험
    }
});

// 조건 하나 받자고 인터페이스를 새로 만듦
interface UserChecker { boolean check(User u); }
`,
          good: String.raw`
users.sort(Comparator.comparingInt(User::getAge)
        .thenComparing(User::getName));

// 표준 인터페이스 재사용
public List<User> find(Predicate<User> condition) {
    return users.stream().filter(condition).toList();
}

find(u -> u.getAge() >= 19);
find(User::isActive);
`,
          note: `자주 쓰는 네 가지: <strong>Predicate</strong>(조건), <strong>Function</strong>(변환), <strong>Consumer</strong>(소비), <strong>Supplier</strong>(공급).`,
        },
        {
          id: 'l10', short: `네이밍`,
          title: `이름만 읽어도 뜻이 통하게`,
          ver: `전 버전`,
          why: `좋은 이름은 주석을 대신합니다. 줄임말과 번호 붙인 이름은 한 달 뒤의 나도 못 읽습니다.`,
          bad: String.raw`
class data_manager {
    static final int max = 3;
    int d;
    List<User> list1;
    boolean flag;

    void proc() { ... }
    boolean check(User u) { ... }
}
`,
          good: String.raw`
class InvoiceSender {
    static final int MAX_RETRY_COUNT = 3;
    int elapsedDays;
    List<User> activeUsers;
    boolean isExpired;

    void sendInvoice() { ... }
    boolean canReceive(User user) { ... }
}
`,
          note: `클래스는 <strong>PascalCase 명사</strong>, 메서드는 <strong>camelCase 동사</strong>, 상수는 <strong>UPPER_SNAKE_CASE</strong>, boolean은 <strong>is / has / can</strong>으로 시작합니다.`,
        },
      ],
    },
    {
      id: 'java-4', no: 4, name: `테스트와 실무 습관`,
      lead: `테스트를 쓰는 방법과, 실무 코드 리뷰에서 자주 지적받는 습관입니다. 제목 옆 표시는 그 항목에 필요한 라이브러리입니다.`,
      lessons: [
        {
          id: 'l1', short: `JUnit 5`,
          title: `눈으로 확인하지 말고 테스트로`,
          ver: `JUnit 5`,
          why: `main에서 출력해 눈으로 보는 코드는 다시 돌리지 않게 됩니다. 테스트는 한 번 써 두면 코드를 고칠 때마다 자동으로 검증합니다.`,
          bad: String.raw`
public class CalculatorMain {
    public static void main(String[] args) {
        Calculator c = new Calculator();
        System.out.println(c.add(2, 3));  // 5가 나오는지 눈으로 확인
    }
}
`,
          good: String.raw`
class CalculatorTest {

    @Test
    void 두_수를_더한다() {
        Calculator calculator = new Calculator();

        int result = calculator.add(2, 3);

        assertEquals(5, result);
    }
}
`,
          note: `테스트 클래스는 <strong>src/test/java</strong> 아래, 대상 클래스와 같은 패키지에 둡니다. 이름은 대상 클래스 뒤에 Test를 붙입니다.`,
        },
        {
          id: 'l2', short: `given-when-then`,
          title: `준비, 실행, 검증으로 나누기`,
          ver: `JUnit 5`,
          why: `세 단계를 빈 줄로 나누면 무엇을 테스트하는지 한눈에 보입니다. 테스트 하나는 한 가지 동작만 검증합니다.`,
          bad: String.raw`
@Test
void test() {
    Cart cart = new Cart();
    cart.add(new Item("커피", 4500));
    assertEquals(4500, cart.total());
    cart.add(new Item("차", 4000));
    assertEquals(8500, cart.total());
    cart.clear();
    assertEquals(0, cart.total());  // 어디서 깨졌는지 찾기 어려움
}
`,
          good: String.raw`
@Test
void 상품을_담으면_합계가_늘어난다() {
    // given
    Cart cart = new Cart();
    cart.add(new Item("커피", 4500));

    // when
    cart.add(new Item("차", 4000));

    // then
    assertEquals(8500, cart.total());
}
`,
        },
        {
          id: 'l3', short: `테스트 이름`,
          title: `테스트 이름은 문장으로`,
          ver: `JUnit 5`,
          why: `실패했을 때 이름만 보고 무엇이 깨졌는지 알 수 있어야 합니다. "조건 + 기대 결과"를 그대로 씁니다.`,
          bad: String.raw`
@Test
void test1() { ... }

@Test
void testWithdraw() { ... }

@Test
void withdrawTest2() { ... }
`,
          good: String.raw`
@Test
void 잔액보다_많이_출금하면_예외가_발생한다() { ... }

@Test
@DisplayName("잔액과 같은 금액은 출금할 수 있다")
void withdrawExactBalance() { ... }
`,
          note: `테스트 메서드 이름은 <strong>한글로 써도 됩니다.</strong> 팀 규칙이 영어라면 @DisplayName에 한글 설명을 붙입니다.`,
        },
        {
          id: 'l4', short: `Mockito`,
          title: `외부 시스템은 가짜 객체로`,
          ver: `Mockito`,
          why: `결제, 메일, 외부 API를 진짜로 호출하면 느리고 불안정합니다. 가짜로 바꿔 내 코드만 검증합니다. 2회차 07번의 생성자 주입이 있어야 가능합니다.`,
          bad: String.raw`
@Test
void 주문하면_결제된다() {
    // 진짜 결제 서버 호출: 느리고, 돈이 나가고, 서버가 죽으면 실패
    OrderService service = new OrderService(new TossGateway());

    service.pay(order);
}
`,
          good: String.raw`
@Test
void 주문하면_주문_금액만큼_결제를_요청한다() {
    // given
    PaymentGateway gateway = mock(PaymentGateway.class);
    OrderService service = new OrderService(gateway);
    Order order = new Order(10_000);

    // when
    service.pay(order);

    // then
    verify(gateway).charge(10_000);
}
`,
          note: `가짜 객체가 값을 돌려줘야 하면 <strong>when(gateway.isAvailable()).thenReturn(true)</strong>처럼 미리 정해 둡니다.`,
        },
        {
          id: 'l5', short: `파라미터화`,
          title: `입력만 다른 테스트는 표로`,
          ver: `JUnit 5`,
          why: `같은 테스트를 복사해 숫자만 바꾸지 않습니다. 표 한 장으로 쓰면 경계값을 추가하기 쉽습니다.`,
          bad: String.raw`
@Test void 점수_95는_A() { assertEquals("A", grade(95)); }
@Test void 점수_90은_A() { assertEquals("A", grade(90)); }
@Test void 점수_89는_B() { assertEquals("B", grade(89)); }
@Test void 점수_0은_B()  { assertEquals("B", grade(0)); }
`,
          good: String.raw`
@ParameterizedTest
@CsvSource({
    "95, A",
    "90, A",   // 경계값
    "89, B",   // 경계값
    "0,  B"
})
void 점수에_따라_등급을_매긴다(int score, String expected) {
    assertEquals(expected, grade(score));
}
`,
          note: `<strong>junit-jupiter-params</strong> 의존성이 필요합니다. 스프링 부트의 spring-boot-starter-test에는 이미 들어 있습니다.`,
        },
        {
          id: 'l6', short: `커스텀 예외`,
          title: `예외 이름으로 원인을 말하기`,
          why: `RuntimeException("error")로는 무슨 일인지 알 수 없습니다. 전용 예외를 만들면 호출하는 쪽이 그것만 골라 잡을 수 있고, 메시지의 값으로 추적이 됩니다.`,
          bad: String.raw`
public void withdraw(long amount) {
    if (amount > balance) {
        throw new RuntimeException("error");
    }
    balance -= amount;
}

// 호출하는 쪽: 다른 오류까지 전부 잡힘
catch (RuntimeException e) { ... }
`,
          good: String.raw`
public class InsufficientBalanceException extends RuntimeException {
    public InsufficientBalanceException(long balance, long amount) {
        super("잔액 부족: 잔액=" + balance + ", 요청=" + amount);
    }
}

public void withdraw(long amount) {
    if (amount > balance) {
        throw new InsufficientBalanceException(balance, amount);
    }
    balance -= amount;
}
`,
        },
        {
          id: 'l7', short: `입력 검증`,
          title: `입력값 검증은 입구에서`,
          why: `잘못된 값은 들어오는 순간 막습니다. 그래야 오류가 원인 지점에서 나고, 안쪽 코드는 값이 올바르다고 믿고 쓸 수 있습니다.`,
          bad: String.raw`
public Member(String name, int age) {
    this.name = name;   // null이 들어와도 통과
    this.age = age;     // -5가 들어와도 통과
}

// 한참 뒤, 전혀 다른 곳에서 NullPointerException
member.getName().length();
`,
          good: String.raw`
public Member(String name, int age) {
    Objects.requireNonNull(name, "name은 필수입니다");
    if (name.isBlank()) {
        throw new IllegalArgumentException("name이 비어 있습니다");
    }
    if (age < 0) {
        throw new IllegalArgumentException("age는 0 이상: " + age);
    }
    this.name = name;
    this.age = age;
}
`,
          note: `스프링에서는 요청 객체에 <strong>@NotBlank, @Min</strong> 같은 검증 애너테이션을 붙이고 컨트롤러 매개변수에 <strong>@Valid</strong>를 씁니다.`,
        },
        {
          id: 'l8', short: `한 가지 일`,
          title: `메서드는 한 가지 일만`,
          why: `위에서 아래로 읽으면 목차처럼 흐름이 보여야 합니다. 작은 메서드는 이름이 곧 설명이고, 따로 테스트하고 재사용하기 쉽습니다.`,
          bad: String.raw`
public void register(String email, String password) {
    if (email == null || !email.contains("@")) {
        throw new IllegalArgumentException("이메일 형식 오류");
    }
    if (password.length() < 8) {
        throw new IllegalArgumentException("비밀번호는 8자 이상");
    }
    String hash = encoder.encode(password);
    Member member = new Member(email, hash);
    repository.save(member);
    mailSender.send(email, "가입을 환영합니다");
}
`,
          good: String.raw`
public void register(String email, String password) {
    validate(email, password);
    Member member = createMember(email, password);
    repository.save(member);
    sendWelcomeMail(member);
}

private void validate(String email, String password) { ... }
private Member createMember(String email, String password) { ... }
private void sendWelcomeMail(Member member) { ... }
`,
        },
        {
          id: 'l9', short: `주석`,
          title: `주석보다 코드로 설명`,
          why: `코드가 바뀌면 주석은 거짓말이 됩니다. 무엇을 하는지는 이름으로 드러내고, 주석에는 코드로 표현할 수 없는 이유만 남깁니다.`,
          bad: String.raw`
// 성인이고 활성 상태이며 최근 30일 안에 로그인했는지 확인
if (m.getAge() >= 19 && m.getStatus() == 1
        && m.getLastLogin().isAfter(LocalDate.now().minusDays(30))) {
    ...
}

i++;  // i를 1 증가
`,
          good: String.raw`
if (member.isAdult() && member.isActive() && member.loggedInWithin(30)) {
    ...
}

// 주석은 "왜"를 쓸 때만
// PG사 정책상 결제 후 5초 안에는 취소 요청이 거부된다
Thread.sleep(5_000);
`,
        },
        {
          id: 'l10', short: `설정 분리`,
          title: `설정값은 코드 밖으로`,
          why: `개발과 운영 환경마다 값이 다르고, 값을 바꾸려고 다시 빌드할 수는 없습니다. 비밀번호와 키는 절대 소스에 넣지 않습니다.`,
          bad: String.raw`
public class MailClient {
    private final String host = "smtp.company.com";
    private final String password = "p@ssw0rd!";  // 깃에 비밀번호가 올라감
    private final int timeout = 3000;
}
`,
          good: String.raw`
// application.properties
//   mail.host=smtp.company.com
//   mail.timeout=3000
// 비밀번호는 환경 변수 MAIL_PASSWORD 로

public class MailClient {
    private final String host;
    private final String password;
    private final int timeout;

    public MailClient(Properties props) {
        this.host = props.getProperty("mail.host");
        this.timeout = Integer.parseInt(props.getProperty("mail.timeout", "3000"));
        this.password = System.getenv("MAIL_PASSWORD");
    }
}
`,
          note: `스프링에서는 application.yml에 쓰고 <strong>@Value</strong> 또는 <strong>@ConfigurationProperties</strong>로 주입받습니다.`,
        },
      ],
    },
    {
      id: 'java-5', no: 5, name: `컬렉션 제대로 쓰기`,
      lead: `List, Set, Map을 고르고 다루는 습관입니다. 같은 일을 하더라도 자료구조를 잘못 고르면 느려지거나 예외가 납니다.`,
      lessons: [
        {
          id: 'l1', short: `ArrayList · ArrayDeque`,
          title: `기본은 ArrayList, 큐는 ArrayDeque`,
          why: `LinkedList는 인덱스로 꺼낼 때마다 처음부터 따라가야 해서 대부분의 경우 더 느립니다. 양쪽 끝에서 넣고 빼는 용도는 ArrayDeque가 맡습니다.`,
          bad: String.raw`
List<String> names = new LinkedList<>();   // "삽입이 빠르다니까"
for (int i = 0; i < names.size(); i++) {
    String name = names.get(i);            // 매번 처음부터 따라감
}
`,
          good: String.raw`
List<String> names = new ArrayList<>();    // 대부분의 경우 정답
for (String name : names) { ... }

// 양쪽 끝에서 넣고 빼는 큐, 스택
Deque<String> queue = new ArrayDeque<>();
queue.addLast("a");
String first = queue.pollFirst();
`,
        },
        {
          id: 'l2', short: `Map 키`,
          title: `Map의 키는 불변 객체로`,
          why: `키를 넣은 뒤에 내용이 바뀌면 hashCode도 바뀌어서 값을 다시 찾을 수 없습니다. 키는 불변이면서 equals와 hashCode가 있는 타입을 씁니다.`,
          bad: String.raw`
List<String> key = new ArrayList<>(List.of("a"));
Map<List<String>, Integer> map = new HashMap<>();
map.put(key, 1);

key.add("b");     // 키가 바뀌면 hashCode도 바뀜
map.get(key);     // null : 값을 영영 못 찾음
`,
          good: String.raw`
record Coord(int x, int y) {}

Map<Coord, String> board = new HashMap<>();
board.put(new Coord(1, 2), "돌");
board.get(new Coord(1, 2));   // "돌"

// 안전한 키 : String, Integer, enum, record
`,
        },
        {
          id: 'l3', short: `removeIf`,
          title: `반복 중 삭제는 removeIf`,
          why: `for-each로 도는 중에 같은 리스트에서 remove를 부르면 예외가 납니다. 조건 삭제는 removeIf 한 줄로 씁니다.`,
          bad: String.raw`
for (User user : users) {
    if (!user.isActive()) {
        users.remove(user);   // ConcurrentModificationException
    }
}
`,
          good: String.raw`
users.removeIf(user -> !user.isActive());

// 원본을 남겨야 하면 새 리스트로
List<User> active = users.stream()
        .filter(User::isActive)
        .toList();
`,
        },
        {
          id: 'l4', short: `Set`,
          title: `중복 제거와 포함 검사는 Set`,
          why: `List의 contains는 전체를 훑습니다. 반복문 안에서 쓰면 데이터가 늘수록 급격히 느려집니다. Set은 바로 찾습니다.`,
          bad: String.raw`
List<String> unique = new ArrayList<>();
for (String tag : tags) {
    if (!unique.contains(tag)) {   // 매번 전체를 훑음
        unique.add(tag);
    }
}
`,
          good: String.raw`
Set<String> unique = new LinkedHashSet<>(tags);   // 넣은 순서 유지

boolean seen = unique.contains("java");           // 바로 찾음

// 순서가 필요 없으면 HashSet, 정렬이 필요하면 TreeSet
`,
        },
        {
          id: 'l5', short: `정렬`,
          title: `정렬 조건은 Comparator 조합으로`,
          why: `뺄셈으로 비교하면 오름차순인지 내림차순인지 한참 봐야 하고 큰 수에서 넘칩니다. 조합 메서드는 조건을 문장처럼 읽게 해 줍니다.`,
          bad: String.raw`
Collections.sort(users, (a, b) -> {
    if (a.getScore() != b.getScore()) {
        return b.getScore() - a.getScore();     // 내림차순? 오름차순?
    }
    return a.getName().compareTo(b.getName());  // name이 null이면 예외
});
`,
          good: String.raw`
users.sort(
    Comparator.comparingInt(User::getScore).reversed()   // 점수 높은 순
        .thenComparing(User::getName,                    // 같으면 이름순
            Comparator.nullsLast(Comparator.naturalOrder())));
`,
        },
        {
          id: 'l6', short: `merge · computeIfAbsent`,
          title: `Map의 "없으면 만들고"는 메서드로`,
          why: `꺼내서 null인지 보고 다시 넣는 코드를 직접 쓰지 않습니다. Map이 제공하는 메서드가 더 짧고 실수가 없습니다.`,
          bad: String.raw`
Integer count = counts.get(word);
if (count == null) {
    counts.put(word, 1);
} else {
    counts.put(word, count + 1);
}

if (!groups.containsKey(dept)) {
    groups.put(dept, new ArrayList<>());
}
groups.get(dept).add(employee);
`,
          good: String.raw`
counts.merge(word, 1, Integer::sum);                  // 세기

groups.computeIfAbsent(dept, k -> new ArrayList<>())  // 묶기
      .add(employee);

int stock = stockByItem.getOrDefault(item, 0);        // 기본값
`,
        },
        {
          id: 'l7', short: `배열 ↔ 리스트`,
          title: `Arrays.asList의 함정 피하기`,
          why: `Arrays.asList는 배열을 감싼 고정 크기 뷰입니다. 추가가 안 되고, 배열을 바꾸면 리스트도 같이 바뀝니다. 기본형 배열에는 아예 다르게 동작합니다.`,
          bad: String.raw`
String[] arr = {"a", "b"};
List<String> list = Arrays.asList(arr);
list.add("c");    // UnsupportedOperationException
arr[0] = "z";     // list.get(0)도 "z"로 바뀜

int[] nums = {1, 2, 3};
List<int[]> wrong = Arrays.asList(nums);   // 원소 1개짜리 리스트
`,
          good: String.raw`
List<String> list = new ArrayList<>(Arrays.asList(arr));   // 독립된 복사본
List<String> fixed = List.of(arr);                         // 불변 복사본

List<Integer> boxed = Arrays.stream(nums).boxed().toList();

String[] back = list.toArray(new String[0]);
`,
        },
        {
          id: 'l8', short: `박싱`,
          title: `불필요한 박싱 피하기`,
          why: `Long, Integer 같은 래퍼 타입으로 계산하면 매번 객체가 만들어집니다. 그리고 래퍼끼리 ==로 비교하면 값이 아니라 주소를 봅니다.`,
          bad: String.raw`
Long sum = 0L;
for (long i = 0; i < 1_000_000; i++) {
    sum += i;              // 매번 Long 객체를 새로 만듦
}

Integer a = 1000, b = 1000;
if (a == b) { ... }        // false : 주소 비교
`,
          good: String.raw`
long sum = 0L;
for (long i = 0; i < 1_000_000; i++) {
    sum += i;
}

Integer a = 1000, b = 1000;
if (a.equals(b)) { ... }   // true

int total = orders.stream().mapToInt(Order::getAmount).sum();
`,
          note: `-128부터 127까지의 Integer는 캐시되어 있어서 ==가 우연히 true가 됩니다. <strong>작은 수로 테스트하면 통과하고 운영에서 깨지는</strong> 대표적인 버그입니다.`,
        },
        {
          id: 'l9', short: `초기 용량`,
          title: `개수를 알면 초기 용량 지정`,
          why: `ArrayList는 꽉 찰 때마다 더 큰 배열을 만들어 통째로 복사합니다. 개수를 미리 알면 처음부터 그만큼 잡습니다.`,
          bad: String.raw`
List<Row> rows = new ArrayList<>();          // 10칸에서 시작
for (int i = 0; i < 100_000; i++) {
    rows.add(read(i));                       // 찰 때마다 새 배열로 복사
}
`,
          good: String.raw`
List<Row> rows = new ArrayList<>(100_000);

StringBuilder sb = new StringBuilder(4096);

// HashMap은 (예상 개수 / 0.75)보다 크게
Map<String, Row> byId = new HashMap<>(expected * 4 / 3 + 1);
`,
          note: `수백 개 이하에서는 차이가 없습니다. <strong>개수를 미리 아는 큰 컬렉션</strong>에서만 신경 쓰면 됩니다.`,
        },
        {
          id: 'l10', short: `for문이 나을 때`,
          title: `스트림을 쓰지 말아야 할 때`,
          why: `인덱스가 필요하거나, 중간에 멈추거나, 바깥 변수를 바꿔야 하면 for문이 더 읽기 쉽습니다. 스트림 안에서 바깥 상태를 바꾸는 것은 피합니다.`,
          bad: String.raw`
// 인덱스가 필요한데 억지로 스트림
IntStream.range(0, names.size())
        .forEach(i -> System.out.println(i + ": " + names.get(i)));

// forEach 안에서 바깥 리스트를 바꿈
List<String> result = new ArrayList<>();
names.stream().filter(n -> n.length() > 3).forEach(result::add);
`,
          good: String.raw`
for (int i = 0; i < names.size(); i++) {
    System.out.println(i + ": " + names.get(i));
}

List<String> result = names.stream()
        .filter(n -> n.length() > 3)
        .toList();
`,
        },
      ],
    },
    {
      id: 'java-6', no: 6, name: `스트림 깊이 쓰기`,
      lead: `1회차 10번과 3회차 08번에서 본 스트림을 한 단계 더 들어갑니다. 자주 쓰는 수집 패턴과, 모르고 쓰면 예외가 나는 지점들입니다.`,
      lessons: [
        {
          id: 'l1', short: `flatMap`,
          title: `리스트의 리스트는 flatMap으로 펴기`,
          why: `map은 하나를 하나로 바꿉니다. 하나가 여러 개로 펼쳐져야 하면 flatMap을 씁니다.`,
          bad: String.raw`
List<List<Item>> nested = orders.stream()
        .map(Order::getItems)
        .toList();

List<Item> all = new ArrayList<>();
for (List<Item> items : nested) {
    all.addAll(items);
}
`,
          good: String.raw`
List<Item> all = orders.stream()
        .flatMap(order -> order.getItems().stream())
        .toList();
`,
        },
        {
          id: 'l2', short: `toMap`,
          title: `toMap에는 중복 키 처리를 함께`,
          why: `키가 겹치면 toMap은 예외를 던집니다. 데이터에 중복이 하나만 있어도 전체가 실패하므로, 겹칠 때 어떻게 할지 세 번째 인자로 정합니다.`,
          bad: String.raw`
Map<String, User> byEmail = users.stream()
        .collect(Collectors.toMap(User::getEmail, u -> u));
// 같은 이메일이 둘이면 IllegalStateException: Duplicate key
`,
          good: String.raw`
Map<String, User> byEmail = users.stream()
        .collect(Collectors.toMap(
                User::getEmail,
                Function.identity(),
                (first, second) -> first));   // 겹치면 먼저 것 유지
`,
          note: `넣은 순서를 지켜야 하면 네 번째 인자로 <strong>LinkedHashMap::new</strong>를 넘깁니다.`,
        },
        {
          id: 'l3', short: `재사용 금지`,
          title: `스트림은 한 번만 쓸 수 있다`,
          why: `스트림은 한 번 끝까지 흘려보내면 닫힙니다. 결과를 여러 번 써야 하면 컬렉션으로 받아 둡니다.`,
          bad: String.raw`
Stream<String> stream = names.stream().filter(n -> n.startsWith("k"));

long count = stream.count();
List<String> list = stream.toList();   // IllegalStateException
`,
          good: String.raw`
List<String> filtered = names.stream()
        .filter(n -> n.startsWith("k"))
        .toList();

int count = filtered.size();   // 컬렉션은 몇 번이든 재사용
`,
        },
        {
          id: 'l4', short: `mapToInt`,
          title: `숫자 계산은 기본형 스트림으로`,
          why: `mapToInt로 바꾸면 박싱이 없고 sum, average, max 같은 메서드를 바로 쓸 수 있습니다. 비어 있을 때의 처리도 Optional로 드러납니다.`,
          bad: String.raw`
int total = orders.stream()
        .map(Order::getAmount)
        .reduce(0, (a, b) -> a + b);           // 박싱, 언박싱 반복

double avg = (double) total / orders.size();   // 비어 있으면 NaN
`,
          good: String.raw`
int total = orders.stream().mapToInt(Order::getAmount).sum();

OptionalDouble avg = orders.stream().mapToInt(Order::getAmount).average();

// 합계, 평균, 최소, 최대를 한 번에
IntSummaryStatistics stats = orders.stream()
        .mapToInt(Order::getAmount)
        .summaryStatistics();
`,
        },
        {
          id: 'l5', short: `anyMatch · findFirst`,
          title: `있는지만 볼 때는 anyMatch`,
          why: `count로 세면 끝까지 다 봅니다. anyMatch와 findFirst는 찾는 즉시 멈춥니다.`,
          bad: String.raw`
boolean hasAdmin = users.stream()
        .filter(User::isAdmin)
        .count() > 0;            // 끝까지 다 셈

User first = users.stream()
        .filter(User::isAdmin)
        .toList().get(0);        // 없으면 IndexOutOfBoundsException
`,
          good: String.raw`
boolean hasAdmin = users.stream().anyMatch(User::isAdmin);

Optional<User> first = users.stream()
        .filter(User::isAdmin)
        .findFirst();

boolean allAdult = users.stream().allMatch(u -> u.getAge() >= 19);
`,
        },
        {
          id: 'l6', short: `긴 람다`,
          title: `긴 람다는 이름 있는 메서드로`,
          why: `람다가 세 줄을 넘으면 스트림의 흐름이 안 보입니다. 메서드로 빼면 이름이 설명이 되고 따로 테스트할 수 있습니다.`,
          bad: String.raw`
List<String> result = orders.stream()
        .filter(o -> {
            if (o.getStatus() != Status.PAID) return false;
            if (o.getTotal() < 10_000) return false;
            return o.getPaidAt().isAfter(LocalDate.now().minusDays(7));
        })
        .map(o -> o.getUser().getName() + " (" + o.getTotal() + "원)")
        .toList();
`,
          good: String.raw`
List<String> result = orders.stream()
        .filter(this::isRecentBigOrder)
        .map(this::toSummary)
        .toList();

private boolean isRecentBigOrder(Order o) { ... }
private String toSummary(Order o) { ... }
`,
        },
        {
          id: 'l7', short: `partitioningBy · joining`,
          title: `둘로 나누기와 이어 붙이기`,
          why: `조건으로 둘로 가르는 일과 구분자로 이어 붙이는 일은 전용 수집기가 있습니다. 마지막 쉼표를 잘라내는 코드를 쓰지 않아도 됩니다.`,
          bad: String.raw`
List<User> adults = new ArrayList<>();
List<User> minors = new ArrayList<>();
for (User u : users) {
    if (u.getAge() >= 19) adults.add(u); else minors.add(u);
}

String names = "";
for (User u : users) names += u.getName() + ", ";
names = names.substring(0, names.length() - 2);   // 비어 있으면 예외
`,
          good: String.raw`
Map<Boolean, List<User>> byAdult = users.stream()
        .collect(Collectors.partitioningBy(u -> u.getAge() >= 19));
List<User> adults = byAdult.get(true);
List<User> minors = byAdult.get(false);

String names = users.stream()
        .map(User::getName)
        .collect(Collectors.joining(", "));
`,
        },
        {
          id: 'l8', short: `병렬 스트림`,
          title: `parallelStream은 함부로 쓰지 않기`,
          why: `병렬이라고 무조건 빨라지지 않고, 공유 상태를 건드리면 값이 사라집니다. 데이터가 아주 많고 순수한 계산일 때만 씁니다.`,
          bad: String.raw`
List<Integer> result = new ArrayList<>();
numbers.parallelStream()
        .map(n -> n * 2)
        .forEach(result::add);   // ArrayList는 스레드에 안전하지 않음 : 값 누락
`,
          good: String.raw`
List<Integer> result = numbers.stream()   // 기본은 순차
        .map(n -> n * 2)
        .toList();

// 병렬은 데이터가 많고, CPU 계산이고, 공유 상태가 없을 때만
long count = hugeList.parallelStream().filter(this::isPrime).count();
`,
          note: `병렬 스트림은 <strong>공용 스레드 풀</strong>을 나눠 씁니다. 그 안에서 DB나 네트워크를 호출하면 애플리케이션 전체가 느려질 수 있습니다.`,
        },
        {
          id: 'l9', short: `Optional 체인`,
          title: `겹겹이 null 검사 대신 Optional 체인`,
          why: `단계마다 null일 수 있는 값을 따라 들어갈 때 if가 계단처럼 쌓입니다. map으로 이으면 중간이 비어도 끝까지 안전합니다.`,
          bad: String.raw`
String city = "미상";
if (user != null) {
    Address address = user.getAddress();
    if (address != null) {
        String c = address.getCity();
        if (c != null) {
            city = c;
        }
    }
}
`,
          good: String.raw`
String city = Optional.ofNullable(user)
        .map(User::getAddress)
        .map(Address::getCity)
        .orElse("미상");
`,
          note: `orElse의 인자는 값이 있어도 항상 계산됩니다. 비용이 큰 기본값은 <strong>orElseGet(() -&gt; ...)</strong>으로 넘깁니다.`,
        },
        {
          id: 'l10', short: `상위 N개`,
          title: `상위 N개는 sorted와 limit`,
          why: `복사하고, 정렬하고, 앞에서 몇 개 꺼내는 과정을 한 줄로 이어 씁니다. 원본 리스트도 바뀌지 않습니다.`,
          bad: String.raw`
List<Product> copy = new ArrayList<>(products);
Collections.sort(copy, (a, b) -> b.getSales() - a.getSales());

List<Product> top3 = new ArrayList<>();
for (int i = 0; i < 3 && i < copy.size(); i++) {
    top3.add(copy.get(i));
}
`,
          good: String.raw`
List<Product> top3 = products.stream()
        .sorted(Comparator.comparingInt(Product::getSales).reversed())
        .limit(3)
        .toList();

// 하나만 필요하면 정렬 없이
Optional<Product> best = products.stream()
        .max(Comparator.comparingInt(Product::getSales));
`,
        },
      ],
    },
    {
      id: 'java-7', no: 7, name: `예외와 자원 관리`,
      lead: `1회차 05번, 09번에서 본 예외 처리를 이어갑니다. 예외를 언제 던지고 어디서 잡을지, 그리고 원인을 잃지 않는 방법입니다.`,
      lessons: [
        {
          id: 'l1', short: `흐름 제어 금지`,
          title: `예외로 흐름을 제어하지 않기`,
          why: `예외는 예외적인 상황에만 씁니다. 정상 흐름을 예외로 처리하면 느리고, 진짜 오류와 구분이 안 됩니다.`,
          bad: String.raw`
try {
    int i = 0;
    while (true) {
        process(array[i++]);
    }
} catch (ArrayIndexOutOfBoundsException e) {
    // 끝까지 돌았다는 뜻
}
`,
          good: String.raw`
for (String value : array) {
    process(value);
}

// 흔히 일어나는 경우는 예외 대신 미리 검사
if (input != null && input.matches("\\d{1,9}")) {
    return Integer.parseInt(input);
}
return 0;
`,
        },
        {
          id: 'l2', short: `checked · unchecked`,
          title: `checked와 unchecked 구분해서 쓰기`,
          why: `throws Exception은 호출자에게 아무 정보도 주지 않습니다. 호출자가 복구할 수 있으면 checked, 프로그래밍 오류나 복구 불가면 unchecked를 씁니다.`,
          bad: String.raw`
public User find(long id) throws Exception { ... }   // 뭘 대비해야 하지?

// 구현 세부사항이 시그니처로 새어 나감
public void save(User u) throws SQLException, IOException { ... }
`,
          good: String.raw`
// 호출자가 복구할 수 있는 상황 : checked
public Receipt pay(Order order) throws PaymentDeclinedException { ... }

// 프로그래밍 오류, 복구 불가 : unchecked
public User find(long id) {
    return repo.findById(id)
            .orElseThrow(() -> new UserNotFoundException(id));
}
`,
        },
        {
          id: 'l3', short: `finally`,
          title: `finally에서는 정리만`,
          why: `finally 안에서 return하거나 예외를 던지면 try에서 난 예외가 조용히 사라집니다. finally는 정리 코드만 둡니다.`,
          bad: String.raw`
public int read() {
    try {
        return riskyRead();    // 여기서 예외가 나도
    } finally {
        return -1;             // 이 return이 예외를 삼켜 버림
    }
}
`,
          good: String.raw`
public int read() {
    try {
        return riskyRead();
    } finally {
        cleanup();             // 정리만. return, throw 금지
    }
}
`,
        },
        {
          id: 'l4', short: `메시지`,
          title: `예외 메시지에 값을 담기`,
          why: `"잘못된 값"만으로는 로그를 보고 아무것도 할 수 없습니다. 어떤 값이 왜 안 되는지 메시지에 넣습니다.`,
          bad: String.raw`
throw new IllegalArgumentException("잘못된 값");

throw new IllegalStateException();
`,
          good: String.raw`
throw new IllegalArgumentException(
        "수량은 1 이상 100 이하: quantity=" + quantity + ", itemId=" + itemId);

throw new IllegalStateException(
        "배송 시작 후에는 취소 불가: orderId=" + id + ", status=" + status);
`,
          note: `비밀번호, 주민번호, 카드번호 같은 <strong>개인정보는 메시지에 넣지 않습니다.</strong> 로그에 그대로 남습니다.`,
        },
        {
          id: 'l5', short: `로그 한 번`,
          title: `로그 남기고 다시 던지지 않기`,
          why: `잡은 곳마다 로그를 찍고 다시 던지면 같은 스택 트레이스가 여러 번 남습니다. 처리하는 곳에서 한 번만 기록합니다.`,
          bad: String.raw`
try {
    repository.save(order);
} catch (DataAccessException e) {
    log.error("저장 실패", e);
    throw e;               // 위에서 또 로그 : 같은 스택이 여러 번
}
`,
          good: String.raw`
// 방법 1 : 처리할 수 있는 곳에서 한 번만 로그
try {
    orderService.place(order);
} catch (DataAccessException e) {
    log.error("주문 저장 실패 orderId={}", order.getId(), e);
    return Response.error("잠시 후 다시 시도해 주세요");
}

// 방법 2 : 맥락을 붙여 감싸 던지고, 여기서는 로그를 남기지 않음
throw new OrderSaveException(order.getId(), e);
`,
        },
        {
          id: 'l6', short: `자원 여러 개`,
          title: `자원이 여러 개여도 try-with-resources`,
          why: `finally에서 차례로 close하면 앞에서 예외가 날 때 뒤쪽이 안 닫힙니다. 괄호 안에 나열하면 선언의 역순으로 모두 닫힙니다.`,
          bad: String.raw`
Connection con = dataSource.getConnection();
PreparedStatement ps = con.prepareStatement(sql);
ResultSet rs = ps.executeQuery();
try {
    ...
} finally {
    rs.close();     // 여기서 예외가 나면 아래 둘은 안 닫힘
    ps.close();
    con.close();
}
`,
          good: String.raw`
try (Connection con = dataSource.getConnection();
     PreparedStatement ps = con.prepareStatement(sql);
     ResultSet rs = ps.executeQuery()) {
    ...
}

// 내가 만든 자원도 AutoCloseable을 구현하면 같은 방식으로 쓴다
public class TempDir implements AutoCloseable {
    @Override public void close() { deleteAll(); }
}
`,
        },
        {
          id: 'l7', short: `InterruptedException`,
          title: `InterruptedException을 삼키지 않기`,
          why: `인터럽트는 "그만하라"는 신호입니다. 빈 catch로 잡으면 신호가 사라져 스레드가 멈추지 않습니다.`,
          bad: String.raw`
try {
    Thread.sleep(1000);
} catch (InterruptedException e) {
    // 무시
}
`,
          good: String.raw`
try {
    Thread.sleep(1000);
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();   // 신호를 다시 세우고
    return;                               // 하던 일을 정리하고 빠져나감
}
`,
        },
        {
          id: 'l8', short: `try 범위`,
          title: `try 블록은 좁게`,
          why: `여러 줄을 한 try로 묶으면 어느 줄의 예외인지 구분하지 못하고 엉뚱하게 처리합니다. 대비하려는 그 줄만 감쌉니다.`,
          bad: String.raw`
try {
    Config config = load(path);
    validate(config);
    server.start(config);
} catch (Exception e) {
    // 검증 오류, 시작 오류까지 전부 여기로 옴
    log.warn("설정 파일이 없어 기본값 사용");
    server.start(Config.defaults());
}
`,
          good: String.raw`
Config config;
try {
    config = load(path);
} catch (NoSuchFileException e) {
    log.warn("설정 파일이 없어 기본값 사용: {}", path);
    config = Config.defaults();
}
validate(config);        // 여기서 나는 예외는 그대로 위로
server.start(config);
`,
        },
        {
          id: 'l9', short: `원인 보존`,
          title: `감쌀 때 원인 예외를 넘기기`,
          why: `getMessage만 로그에 남기면 스택 트레이스가 없고, 새 예외에 원인을 안 넘기면 어디서 시작됐는지 알 수 없습니다.`,
          bad: String.raw`
try {
    generate(id);
} catch (IOException e) {
    log.error("실패: " + e.getMessage());          // 스택 트레이스 없음
    throw new ReportException("리포트 생성 실패");   // 원인 사라짐
}
`,
          good: String.raw`
try {
    generate(id);
} catch (IOException | TimeoutException e) {       // 같은 처리면 한 번에
    throw new ReportException("리포트 생성 실패: id=" + id, e);
}
`,
        },
        {
          id: 'l10', short: `표준 예외`,
          title: `표준 예외를 먼저 쓰기`,
          why: `자바에 이미 뜻이 정해진 예외가 있습니다. 읽는 사람이 이름만 보고 상황을 알 수 있으니 새로 만들기 전에 먼저 고릅니다.`,
          bad: String.raw`
if (amount <= 0) throw new Exception("금액 오류");
if (!opened)     throw new RuntimeException("안 열림");
if (index >= size) throw new MyIndexException();
`,
          good: String.raw`
// 인자가 잘못됨
if (amount <= 0) throw new IllegalArgumentException("amount는 양수: " + amount);

// 객체 상태가 맞지 않음
if (!opened) throw new IllegalStateException("open()을 먼저 호출");

// 인덱스 범위 : IndexOutOfBoundsException
Objects.checkIndex(index, size);

// 지원하지 않는 기능
throw new UnsupportedOperationException("읽기 전용");
`,
          note: `도메인에 고유한 상황(잔액 부족, 재고 없음)은 4회차 06번처럼 <strong>전용 예외</strong>를 만듭니다.`,
        },
      ],
    },
    {
      id: 'java-8', no: 8, name: `동시성 기초`,
      lead: `2회차 09번에 이어, 여러 스레드가 같이 도는 코드에서 꼭 지켜야 할 것들입니다. 동시성 버그는 테스트에서 안 나오고 운영에서 가끔 나오기 때문에 습관으로 막아야 합니다.`,
      lessons: [
        {
          id: 'l1', short: `스레드 풀`,
          title: `스레드를 직접 만들지 말고 풀에 맡기기`,
          why: `작업마다 new Thread를 하면 작업 수만큼 스레드가 생깁니다. 풀은 개수를 제한하고 스레드를 재사용합니다.`,
          bad: String.raw`
for (Task task : tasks) {
    new Thread(() -> task.run()).start();   // 작업이 1만 개면 스레드도 1만 개
}
`,
          good: String.raw`
ExecutorService pool = Executors.newFixedThreadPool(8);
try {
    for (Task task : tasks) {
        pool.submit(task::run);
    }
} finally {
    pool.shutdown();   // 꼭 종료
}
`,
          note: `Java 21 이상에서 I/O 대기가 많은 작업은 <strong>Executors.newVirtualThreadPerTaskExecutor()</strong>가 더 간단합니다.`,
        },
        {
          id: 'l2', short: `락 범위`,
          title: `락은 짧게, 느린 작업은 락 밖에서`,
          why: `락을 쥔 채로 네트워크나 DB를 호출하면 그동안 다른 스레드가 전부 기다립니다. 공유 상태를 만지는 순간만 잠급니다.`,
          bad: String.raw`
public synchronized void handle(Request req) {
    Data data = httpClient.fetch(req.url());   // 느린 호출 동안 락을 쥠
    cache.put(req.key(), data);
}
`,
          good: String.raw`
private final Object lock = new Object();

public void handle(Request req) {
    Data data = httpClient.fetch(req.url());   // 락 밖에서
    synchronized (lock) {
        cache.put(req.key(), data);            // 공유 상태를 만지는 순간만
    }
}
`,
        },
        {
          id: 'l3', short: `volatile`,
          title: `스레드 사이의 플래그는 volatile`,
          why: `한 스레드가 바꾼 값을 다른 스레드가 못 볼 수 있습니다. 종료 플래그처럼 한쪽이 쓰고 다른 쪽이 읽는 값은 volatile로 선언합니다.`,
          bad: String.raw`
private boolean running = true;

public void run() {
    while (running) { work(); }   // false로 바뀐 것을 영영 못 볼 수 있음
}
public void stop() { running = false; }
`,
          good: String.raw`
private volatile boolean running = true;

public void run() {
    while (running) { work(); }
}
public void stop() { running = false; }
`,
          note: `volatile은 <strong>보이는 것</strong>만 보장합니다. count++처럼 읽고 쓰는 동작은 여전히 AtomicInteger나 락이 필요합니다.`,
        },
        {
          id: 'l4', short: `검사 후 실행`,
          title: `검사와 실행을 한 동작으로`,
          why: `"없으면 넣는다"를 두 줄로 쓰면 그 사이에 다른 스레드가 끼어듭니다. 스레드에 안전한 컬렉션이어도 두 호출 사이는 보호되지 않습니다.`,
          bad: String.raw`
if (!cache.containsKey(key)) {            // 두 스레드가 동시에 통과
    cache.put(key, loadExpensive(key));   // 두 번 로드됨
}
return cache.get(key);
`,
          good: String.raw`
// cache는 ConcurrentHashMap
return cache.computeIfAbsent(key, this::loadExpensive);
`,
        },
        {
          id: 'l5', short: `CompletableFuture`,
          title: `독립된 호출은 동시에 보내기`,
          why: `서로 기다릴 필요가 없는 외부 호출을 차례로 하면 시간이 그대로 더해집니다. 동시에 보내고 둘 다 끝났을 때 합칩니다.`,
          bad: String.raw`
User user = userApi.get(id);             // 200ms
List<Order> orders = orderApi.get(id);   // 300ms
return new Page(user, orders);           // 합계 500ms
`,
          good: String.raw`
CompletableFuture<User> user =
        CompletableFuture.supplyAsync(() -> userApi.get(id), pool);
CompletableFuture<List<Order>> orders =
        CompletableFuture.supplyAsync(() -> orderApi.get(id), pool);

return user.thenCombine(orders, Page::new)   // 둘 다 끝나면 합침 : 약 300ms
        .orTimeout(2, TimeUnit.SECONDS)
        .join();
`,
        },
        {
          id: 'l6', short: `공유 객체`,
          title: `스레드에 안전하지 않은 객체를 공유하지 않기`,
          why: `SimpleDateFormat은 내부 상태를 바꾸면서 동작합니다. static으로 공유하면 여러 스레드의 날짜가 뒤섞입니다. 불변 객체는 공유해도 안전합니다.`,
          bad: String.raw`
private static final SimpleDateFormat FORMAT = new SimpleDateFormat("yyyy-MM-dd");

public String today() {
    return FORMAT.format(new Date());   // 동시에 쓰면 엉뚱한 날짜가 나옴
}
`,
          good: String.raw`
private static final DateTimeFormatter FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

public String today() {
    return LocalDate.now().format(FORMAT);   // 불변이라 공유해도 안전
}
`,
        },
        {
          id: 'l7', short: `데드락`,
          title: `락은 항상 같은 순서로`,
          why: `두 스레드가 서로 반대 순서로 락을 잡으면 영원히 서로를 기다립니다. 잡는 순서를 하나로 정해 두면 생기지 않습니다.`,
          bad: String.raw`
void transfer(Account from, Account to, long amount) {
    synchronized (from) {
        synchronized (to) {      // A에서 B, B에서 A가 동시에 오면 서로 기다림
            from.withdraw(amount);
            to.deposit(amount);
        }
    }
}
`,
          good: String.raw`
void transfer(Account from, Account to, long amount) {
    Account first = from.id() < to.id() ? from : to;   // 항상 id가 작은 쪽부터
    Account second = first == from ? to : from;
    synchronized (first) {
        synchronized (second) {
            from.withdraw(amount);
            to.deposit(amount);
        }
    }
}
`,
        },
        {
          id: 'l8', short: `ThreadLocal`,
          title: `ThreadLocal은 쓰고 나서 반드시 비우기`,
          why: `스레드 풀은 스레드를 재사용합니다. 비우지 않으면 다음 요청이 이전 요청의 값을 그대로 보게 됩니다.`,
          bad: String.raw`
private static final ThreadLocal<User> CURRENT = new ThreadLocal<>();

public void handle(Request req) {
    CURRENT.set(req.user());
    process(req);
    // 정리 안 함 : 다음 요청이 이전 사용자를 봄
}
`,
          good: String.raw`
public void handle(Request req) {
    CURRENT.set(req.user());
    try {
        process(req);
    } finally {
        CURRENT.remove();   // 반드시 비움
    }
}
`,
        },
        {
          id: 'l9', short: `CopyOnWrite`,
          title: `읽기가 많은 목록은 CopyOnWriteArrayList`,
          why: `순회하는 도중에 다른 스레드가 목록을 바꾸면 예외가 납니다. 리스너 목록처럼 읽기가 많고 쓰기가 드문 경우에 맞는 컬렉션이 있습니다.`,
          bad: String.raw`
private final List<Listener> listeners = new ArrayList<>();

public void fire(Event e) {
    for (Listener l : listeners) {   // 순회 중 다른 스레드가 add : 예외
        l.on(e);
    }
}
`,
          good: String.raw`
private final List<Listener> listeners = new CopyOnWriteArrayList<>();

public void fire(Event e) {
    for (Listener l : listeners) {   // 순회를 시작한 시점의 스냅샷을 봄
        l.on(e);
    }
}
`,
          note: `쓸 때마다 배열 전체를 복사하므로 <strong>쓰기가 잦은 목록에는 맞지 않습니다.</strong>`,
        },
        {
          id: 'l10', short: `타임아웃`,
          title: `기다릴 때는 항상 타임아웃`,
          why: `상대가 응답하지 않으면 끝없이 기다리는 스레드가 쌓여 서버 전체가 멈춥니다. 기다리는 모든 호출에 한도를 둡니다.`,
          bad: String.raw`
Result result = future.get();   // 응답이 없으면 영원히 멈춤
Job job = queue.take();
lock.lock();
`,
          good: String.raw`
Result result = future.get(3, TimeUnit.SECONDS);   // 넘으면 TimeoutException

Job job = queue.poll(1, TimeUnit.SECONDS);         // 없으면 null

if (lock.tryLock(500, TimeUnit.MILLISECONDS)) {
    try { ... } finally { lock.unlock(); }
}
`,
        },
      ],
    },
    {
      id: 'java-9', no: 9, name: `메서드와 API 설계`,
      lead: `다른 사람이 호출할 메서드를 만드는 습관입니다. 호출하는 코드만 보고도 뜻이 통하고, 잘못 쓰기 어렵게 만드는 것이 목표입니다.`,
      lessons: [
        {
          id: 'l1', short: `boolean 인자`,
          title: `boolean 인자 대신 enum이나 메서드 분리`,
          why: `호출하는 쪽에서 true, false만 보고는 뜻을 알 수 없습니다. 이름이 있는 값으로 바꾸거나 메서드를 나눕니다.`,
          bad: String.raw`
sendMail(user, true, false);   // true가 뭐고 false가 뭔지
`,
          good: String.raw`
sendMail(user, Priority.URGENT, Format.TEXT);

// 또는 메서드를 나눔
sendUrgentMail(user);
`,
        },
        {
          id: 'l2', short: `인자 묶기`,
          title: `인자가 많으면 객체로 묶기`,
          why: `인자가 네 개를 넘으면 순서를 외울 수 없고 null이 줄지어 들어갑니다. 관련 있는 값을 하나의 객체로 묶습니다.`,
          bad: String.raw`
List<Order> search(String keyword, LocalDate from, LocalDate to,
                   String status, int page, int size, String sort) { ... }

search("커피", null, null, null, 0, 20, null);
`,
          good: String.raw`
record OrderQuery(String keyword, LocalDate from, LocalDate to,
                  Status status, PageRequest page) {}

List<Order> search(OrderQuery query) { ... }
`,
        },
        {
          id: 'l3', short: `오버로딩`,
          title: `선택 인자는 Optional 대신 오버로딩`,
          why: `매개변수에 Optional을 쓰면 호출이 번거롭고, 그 자리에 null도 들어올 수 있어 검사가 두 배가 됩니다. 메서드를 두 개 두는 편이 깔끔합니다.`,
          bad: String.raw`
List<Order> findOrders(Long userId, Optional<Status> status) { ... }

findOrders(1L, Optional.empty());
findOrders(1L, null);   // Optional 자리에 null도 들어옴
`,
          good: String.raw`
List<Order> findOrders(long userId) { ... }
List<Order> findOrders(long userId, Status status) { ... }

findOrders(1L);
findOrders(1L, Status.PAID);
`,
        },
        {
          id: 'l4', short: `방어적 복사`,
          title: `변경 가능한 인자는 복사해서 보관`,
          why: `받은 객체를 그대로 필드에 넣으면 밖에서 그 객체를 바꿀 때 내 상태도 바뀝니다. 들어올 때와 나갈 때 복사합니다.`,
          bad: String.raw`
public final class Period {
    private final Date start;

    public Period(Date start) {
        this.start = start;     // 밖에서 start.setTime(...) 하면 내부가 바뀜
    }
    public Date getStart() { return start; }
}
`,
          good: String.raw`
public final class Period {
    private final Date start;

    public Period(Date start) {
        this.start = new Date(start.getTime());   // 복사해서 보관
    }
    public Date getStart() {
        return new Date(start.getTime());         // 복사해서 반환
    }
}
`,
          note: `더 좋은 방법은 처음부터 <strong>LocalDate 같은 불변 타입</strong>을 쓰는 것입니다. 복사할 필요가 없어집니다.`,
        },
        {
          id: 'l5', short: `조회와 변경`,
          title: `묻는 메서드와 바꾸는 메서드를 나누기`,
          why: `"확인"하는 줄 알고 불렀는데 상태가 바뀌면 찾기 힘든 버그가 됩니다. 값을 돌려주는 메서드는 상태를 바꾸지 않게 합니다.`,
          bad: String.raw`
public boolean checkAndExpire(Coupon coupon) {
    if (coupon.getExpireDate().isBefore(LocalDate.now())) {
        coupon.setStatus(Status.EXPIRED);   // 확인하면서 몰래 바꿈
        return true;
    }
    return false;
}
`,
          good: String.raw`
public boolean isExpired(Coupon coupon) {    // 묻기만 함
    return coupon.getExpireDate().isBefore(LocalDate.now());
}

public void expire(Coupon coupon) {          // 바꾸기만 함
    coupon.setStatus(Status.EXPIRED);
}
`,
        },
        {
          id: 'l6', short: `시켜라`,
          title: `값을 꺼내 판단하지 말고 객체에 시키기`,
          why: `getter로 꺼내 밖에서 계산하면 같은 규칙이 여러 곳에 복사됩니다. 데이터를 가진 객체가 스스로 하게 합니다.`,
          bad: String.raw`
if (account.getBalance() >= amount) {
    account.setBalance(account.getBalance() - amount);
} else {
    throw new InsufficientBalanceException(account.getBalance(), amount);
}
`,
          good: String.raw`
account.withdraw(amount);

// Account 안에서
public void withdraw(long amount) {
    if (balance < amount) {
        throw new InsufficientBalanceException(balance, amount);
    }
    balance -= amount;
}
`,
        },
        {
          id: 'l7', short: `점 줄이기`,
          title: `여러 단계를 건너 들어가지 않기`,
          why: `a.getB().getC().getD()는 내부 구조를 전부 알아야 쓸 수 있고, 구조가 바뀌면 호출한 곳이 모두 깨집니다. 바로 옆 객체에게만 묻습니다.`,
          bad: String.raw`
String city = order.getCustomer().getAddress().getCity();
`,
          good: String.raw`
String city = order.shippingCity();

// Order 안에서
public String shippingCity() {
    return customer.city();
}
`,
        },
        {
          id: 'l8', short: `유틸 클래스`,
          title: `유틸 클래스는 생성을 막기`,
          why: `static 메서드만 있는 클래스는 객체를 만들 이유가 없습니다. private 생성자로 의도를 드러냅니다.`,
          bad: String.raw`
public class StringUtils {
    public static boolean isBlank(String s) { ... }
}

StringUtils utils = new StringUtils();   // 의미 없는 객체
`,
          good: String.raw`
public final class StringUtils {
    private StringUtils() {}   // 생성 금지

    public static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
`,
        },
        {
          id: 'l9', short: `인터페이스 분리`,
          title: `인터페이스는 작게 나누기`,
          why: `큰 인터페이스를 구현하면 쓰지 않는 메서드까지 억지로 채워야 합니다. 역할별로 나누면 필요한 것만 구현합니다.`,
          bad: String.raw`
interface Worker {
    void work();
    void eat();
    void sleep();
}

class Robot implements Worker {
    public void work() { ... }
    public void eat()   { throw new UnsupportedOperationException(); }   // 억지 구현
    public void sleep() { throw new UnsupportedOperationException(); }
}
`,
          good: String.raw`
interface Workable { void work(); }
interface Eatable  { void eat(); }

class Robot implements Workable {
    public void work() { ... }
}

class Human implements Workable, Eatable {
    public void work() { ... }
    public void eat()  { ... }
}
`,
        },
        {
          id: 'l10', short: `toString`,
          title: `toString을 재정의하기`,
          why: `기본 toString은 클래스 이름과 해시값만 보여 줍니다. 로그와 디버거에서 객체 내용이 바로 보이게 합니다.`,
          bad: String.raw`
log.info("주문 접수: {}", order);
// 출력 : 주문 접수: com.shop.Order@1b6d3586
`,
          good: String.raw`
@Override
public String toString() {
    return "Order{id=" + id + ", status=" + status + ", total=" + total + "}";
}
// 출력 : 주문 접수: Order{id=42, status=PAID, total=15000}
`,
          note: `비밀번호, 토큰, 개인정보 필드는 toString에서 빼거나 가립니다. <strong>record는 toString이 자동</strong>이라 민감한 필드가 있으면 직접 재정의해야 합니다.`,
        },
      ],
    },
    {
      id: 'java-10', no: 10, name: `흔한 버그와 함정`,
      lead: `컴파일은 되는데 결과가 틀리는 코드들입니다. 한 번 알아 두면 다시는 안 당하지만, 모르면 몇 시간을 헤매게 됩니다.`,
      lessons: [
        {
          id: 'l1', short: `정수 연산`,
          title: `정수 나눗셈과 오버플로`,
          why: `정수끼리 나누면 소수점이 버려지고, int 범위를 넘으면 예외 없이 엉뚱한 값이 됩니다. 계산 순서와 타입을 먼저 봅니다.`,
          bad: String.raw`
double rate = 1 / 3;                   // 0.0 : 정수끼리 나눈 뒤에 변환
int percent = count / total * 100;     // 대부분 0
long ms = 24 * 60 * 60 * 1000 * 30;    // int 범위를 넘어 엉뚱한 값
`,
          good: String.raw`
double rate = 1.0 / 3;                 // 0.333...
int percent = count * 100 / total;     // 곱셈 먼저
long ms = 24L * 60 * 60 * 1000 * 30;   // long으로 시작

int sum = Math.addExact(a, b);         // 넘치면 ArithmeticException
`,
        },
        {
          id: 'l2', short: `BigDecimal`,
          title: `돈 계산에 double 쓰지 않기`,
          why: `double은 0.1을 정확히 표현하지 못합니다. 금액은 BigDecimal을 문자열로 만들어 쓰거나, 원 단위 정수로 다룹니다.`,
          bad: String.raw`
double total = 0.1 + 0.2;                 // 0.30000000000000004
if (total == 0.3) { ... }                 // false

BigDecimal price = new BigDecimal(0.1);   // 0.1000000000000000055511...
`,
          good: String.raw`
BigDecimal total = new BigDecimal("0.1").add(new BigDecimal("0.2"));   // 0.3

if (total.compareTo(new BigDecimal("0.30")) == 0) { ... }   // true

long priceWon = 4500;   // 원 단위만 다루면 long으로 충분
`,
          note: `BigDecimal의 <strong>equals는 0.3과 0.30을 다르게 봅니다.</strong> 값 비교는 compareTo를 씁니다.`,
        },
        {
          id: 'l3', short: `split`,
          title: `split은 정규식을 받는다`,
          why: `split의 인자는 문자열이 아니라 정규식입니다. 마침표와 세로선은 특수 문자라서 그대로 쓰면 전혀 다른 결과가 나옵니다.`,
          bad: String.raw`
String[] parts = "a.b.c".split(".");    // 길이 0 : "."은 아무 문자나 뜻함
String[] cols = "1|2|3".split("|");     // 한 글자씩 쪼개짐
int n = "a,b,,".split(",").length;      // 2 : 끝의 빈 값이 사라짐
`,
          good: String.raw`
String[] parts = "a.b.c".split("\\.");               // [a, b, c]
String[] cols = "1|2|3".split(Pattern.quote("|"));   // [1, 2, 3]
String[] all = "a,b,,".split(",", -1);               // [a, b, "", ""]
`,
        },
        {
          id: 'l4', short: `언박싱 NPE`,
          title: `래퍼 타입을 꺼낼 때 null 조심`,
          why: `Integer나 Boolean을 int, boolean 자리에 쓰면 자동으로 꺼내는데, 값이 null이면 그 순간 NullPointerException이 납니다.`,
          bad: String.raw`
Map<String, Integer> stock = new HashMap<>();
int count = stock.get("coffee");     // 키가 없으면 null : NullPointerException

Boolean agreed = user.getAgreed();   // null일 수 있음
if (agreed) { ... }                  // NullPointerException
`,
          good: String.raw`
int count = stock.getOrDefault("coffee", 0);

if (Boolean.TRUE.equals(user.getAgreed())) { ... }   // null이면 false
`,
        },
        {
          id: 'l5', short: `날짜 패턴`,
          title: `날짜 패턴의 YYYY와 시간대`,
          why: `대문자 YYYY는 "주 기준 연도"라서 연말에 다음 해로 찍힙니다. 1년에 며칠만 틀리기 때문에 테스트로 잡히지 않습니다.`,
          bad: String.raw`
DateTimeFormatter f = DateTimeFormatter.ofPattern("YYYY-MM-dd");
LocalDate.of(2025, 12, 29).format(f);    // "2026-12-29"

LocalDateTime now = LocalDateTime.now();   // 서버 시간대에 따라 값이 달라짐
`,
          good: String.raw`
DateTimeFormatter f = DateTimeFormatter.ofPattern("yyyy-MM-dd");   // 소문자
LocalDate.of(2025, 12, 29).format(f);    // "2025-12-29"

Instant saved = Instant.now();                                 // 저장은 절대 시각으로
ZonedDateTime seoul = saved.atZone(ZoneId.of("Asia/Seoul"));   // 보여 줄 때 변환
`,
        },
        {
          id: 'l6', short: `배열 비교`,
          title: `배열은 equals와 출력이 다르게 동작`,
          why: `배열의 equals와 toString은 재정의되어 있지 않아 주소를 비교하고 주소를 출력합니다. Arrays의 메서드를 씁니다.`,
          bad: String.raw`
int[] a = {1, 2, 3};
int[] b = {1, 2, 3};

a.equals(b);                        // false : 주소 비교
System.out.println(a);              // [I@1b6d3586
Set<int[]> set = new HashSet<>();   // 내용이 같아도 다른 원소로 들어감
`,
          good: String.raw`
Arrays.equals(a, b);                       // true
System.out.println(Arrays.toString(a));    // [1, 2, 3]
Arrays.deepEquals(matrix1, matrix2);       // 2차원 배열

Set<List<Integer>> set = new HashSet<>();  // 내용 비교가 필요하면 List
`,
        },
        {
          id: 'l7', short: `static 상태`,
          title: `static 변수에 상태를 두지 않기`,
          why: `static 가변 변수는 모든 객체와 스레드가 공유하는 전역 변수입니다. 테스트 순서에 따라 결과가 달라지고 동시성 버그의 원인이 됩니다.`,
          bad: String.raw`
public class OrderService {
    private static int sequence = 0;   // 모든 인스턴스와 스레드가 공유

    public Order create() {
        return new Order(++sequence);  // 테스트 순서에 따라 번호가 달라짐
    }
}
`,
          good: String.raw`
public class OrderService {
    private final SequenceGenerator sequence;   // 상태는 주입받은 객체가 관리

    public OrderService(SequenceGenerator sequence) {
        this.sequence = sequence;
    }
    public Order create() {
        return new Order(sequence.next());
    }
}
`,
        },
        {
          id: 'l8', short: `+ 연산`,
          title: `문자열 +의 계산 순서`,
          why: `+는 왼쪽부터 계산합니다. 숫자끼리 먼저 만나면 더하고, 문자열을 만난 뒤로는 이어 붙입니다. char는 숫자로 계산됩니다.`,
          bad: String.raw`
char grade = 'A';
String s = grade + 1 + "등급";            // "66등급" : char + int는 숫자

System.out.println("합계: " + 1 + 2);     // "합계: 12"
`,
          good: String.raw`
String s = String.valueOf(grade) + 1 + "등급";   // "A1등급"

System.out.println("합계: " + (1 + 2));          // "합계: 3"
`,
        },
        {
          id: 'l9', short: `remove · subList`,
          title: `List의 remove와 subList 함정`,
          why: `List&lt;Integer&gt;에서 remove(10)은 값 10이 아니라 10번 인덱스를 지웁니다. subList는 복사본이 아니라 원본을 들여다보는 창입니다.`,
          bad: String.raw`
List<Integer> nums = new ArrayList<>(List.of(10, 20, 30));
nums.remove(10);   // IndexOutOfBoundsException : 10번 인덱스를 지우려 함

List<Integer> head = nums.subList(0, 2);
nums.add(40);
head.size();       // ConcurrentModificationException
`,
          good: String.raw`
nums.remove(Integer.valueOf(10));   // 값 10을 삭제
nums.remove(0);                     // 0번 인덱스를 삭제

List<Integer> head = new ArrayList<>(nums.subList(0, 2));   // 독립된 복사본
`,
        },
        {
          id: 'l10', short: `생성자`,
          title: `생성자에서 재정의 가능한 메서드를 부르지 않기`,
          why: `부모 생성자가 먼저 실행됩니다. 그때 자식이 재정의한 메서드가 불리면 자식의 필드는 아직 초기화되지 않은 상태입니다.`,
          bad: String.raw`
class Parent {
    Parent() { init(); }     // 자식이 재정의한 init()이 불림
    void init() {}
}

class Child extends Parent {
    private final List<String> items = new ArrayList<>();

    @Override void init() {
        items.add("기본");   // NullPointerException : items가 아직 null
    }
}
`,
          good: String.raw`
class Parent {
    Parent() { setup(); }
    private void setup() {}  // private이나 final 메서드만 호출
}

class Child extends Parent {
    private final List<String> items = new ArrayList<>();

    Child() {
        items.add("기본");   // 자기 필드 초기화가 끝난 뒤
    }
}
`,
        },
      ],
    },
    {
      id: 'java-11', no: 11, name: `제네릭 깊이 쓰기`,
      lead: `2회차 08번에서 본 제네릭을 직접 설계하는 단계입니다. 캐스팅을 없애고, 잘못된 타입을 컴파일 시점에 막는 것이 목표입니다.`,
      lessons: [
        {
          id: 'l1', short: `제네릭 메서드`,
          title: `Object로 받지 말고 제네릭 메서드로`,
          why: `Object로 주고받으면 꺼낼 때마다 캐스팅해야 하고 틀려도 실행해 봐야 압니다. 타입 매개변수를 쓰면 컴파일러가 대신 맞춰 줍니다.`,
          bad: String.raw`
static Object first(List list) {
    return list.get(0);
}

String name = (String) first(names);   // 캐스팅 필요, 틀리면 실행 중에 오류
`,
          good: String.raw`
static <T> T first(List<T> list) {
    return list.get(0);
}

String name = first(names);    // 캐스팅 없음
Integer n = first(numbers);
`,
        },
        {
          id: 'l2', short: `? extends`,
          title: `꺼내 쓰기만 하면 ? extends`,
          why: `List&lt;Integer&gt;는 List&lt;Number&gt;가 아닙니다. 읽기만 하는 매개변수는 ? extends로 받아야 하위 타입의 리스트도 넘길 수 있습니다.`,
          bad: String.raw`
double sum(List<Number> numbers) {
    double total = 0;
    for (Number n : numbers) total += n.doubleValue();
    return total;
}

List<Integer> ints = List.of(1, 2, 3);
sum(ints);   // 컴파일 오류
`,
          good: String.raw`
double sum(List<? extends Number> numbers) {
    double total = 0;
    for (Number n : numbers) total += n.doubleValue();
    return total;
}

sum(List.of(1, 2, 3));       // List<Integer>
sum(List.of(1.5, 2.5));      // List<Double>
`,
        },
        {
          id: 'l3', short: `? super`,
          title: `넣기만 하면 ? super`,
          why: `값을 넣기만 하는 매개변수는 ? super로 받습니다. Integer를 넣을 수 있는 리스트라면 List&lt;Number&gt;든 List&lt;Object&gt;든 받을 수 있어야 합니다.`,
          bad: String.raw`
void fill(List<Integer> target) {
    target.add(1);
    target.add(2);
}

List<Number> numbers = new ArrayList<>();
fill(numbers);   // 컴파일 오류 : Integer를 담을 수 있는 리스트인데도 거부
`,
          good: String.raw`
void fill(List<? super Integer> target) {
    target.add(1);
    target.add(2);
}

fill(new ArrayList<Number>());
fill(new ArrayList<Object>());

// 둘을 함께 쓰는 전형
static <T> void copy(List<? extends T> from, List<? super T> to) {
    to.addAll(from);
}
`,
          note: `외우는 법: <strong>꺼내면 extends, 넣으면 super.</strong> 둘 다 하면 와일드카드 없이 정확한 타입을 씁니다.`,
        },
        {
          id: 'l4', short: `한정 타입`,
          title: `필요한 능력을 타입에 적기`,
          why: `"비교할 수 있는 타입만 받는다"는 조건을 T extends Comparable로 적으면, 비교 못 하는 타입은 컴파일 단계에서 걸러집니다.`,
          bad: String.raw`
static Object max(List list) {
    Object best = list.get(0);
    for (Object o : list) {
        if (((Comparable) o).compareTo(best) > 0) best = o;   // 비교 못 하는 타입이면 실행 중 오류
    }
    return best;
}
`,
          good: String.raw`
static <T extends Comparable<T>> T max(List<T> list) {
    T best = list.get(0);
    for (T item : list) {
        if (item.compareTo(best) > 0) best = item;
    }
    return best;
}

max(List.of(3, 7, 5));          // 7
max(List.of(new Object()));     // 컴파일 오류
`,
        },
        {
          id: 'l5', short: `타입 소거`,
          title: `T는 실행 시점에 사라진다`,
          why: `제네릭 타입 정보는 컴파일할 때만 있고 실행할 때는 지워집니다. 그래서 new T()도, List&lt;String&gt;인지 검사하는 것도 안 됩니다. 필요하면 만드는 방법을 밖에서 받습니다.`,
          bad: String.raw`
class Box<T> {
    T create() {
        return new T();                      // 컴파일 오류
    }
    boolean isStrings(Object o) {
        return o instanceof List<String>;    // 컴파일 오류
    }
}
`,
          good: String.raw`
class Box<T> {
    private final Supplier<T> factory;

    Box(Supplier<T> factory) { this.factory = factory; }

    T create() { return factory.get(); }
}

Box<User> box = new Box<>(User::new);

boolean isList = o instanceof List<?>;   // 원소 타입까지는 확인할 수 없음
`,
        },
        {
          id: 'l6', short: `제네릭 배열`,
          title: `제네릭 배열 대신 List`,
          why: `배열은 실행 시점에 원소 타입을 알아야 하는데 제네릭은 그 정보가 없어서 둘은 섞이지 않습니다. 제네릭 클래스 안에서는 List를 씁니다.`,
          bad: String.raw`
class Stack<T> {
    private T[] items = new T[10];                           // 컴파일 오류

    private List<String>[] buckets = new List<String>[16];   // 컴파일 오류
}
`,
          good: String.raw`
class Stack<T> {
    private final List<T> items = new ArrayList<>();

    private final List<List<String>> buckets = new ArrayList<>();
}
`,
        },
        {
          id: 'l7', short: `비검사 경고`,
          title: `unchecked 경고를 통째로 끄지 않기`,
          why: `경고는 "여기서 타입이 틀릴 수 있다"는 신호입니다. 클래스 전체에 @SuppressWarnings를 붙이면 진짜 문제도 같이 숨습니다.`,
          bad: String.raw`
@SuppressWarnings("unchecked")   // 클래스 전체의 경고를 꺼 버림
public class Cache {
    public <T> T get(String key) {
        return (T) store.get(key);
    }
}
`,
          good: String.raw`
public class Cache {
    public <T> T get(String key, Class<T> type) {
        return type.cast(store.get(key));   // 검사하는 캐스팅 : 경고가 없음
    }
}

// 꼭 필요하면 변수 하나에만, 안전한 이유와 함께
@SuppressWarnings("unchecked")   // put에서 같은 타입으로만 넣는다
T value = (T) store.get(key);
`,
        },
        {
          id: 'l8', short: `반환 타입`,
          title: `반환 타입에는 와일드카드를 쓰지 않기`,
          why: `와일드카드를 반환하면 호출하는 쪽 변수까지 와일드카드가 번지고 쓰기가 불편해집니다. 와일드카드는 매개변수에만 씁니다.`,
          bad: String.raw`
List<? extends Number> findScores() { ... }

List<? extends Number> scores = findScores();   // 호출하는 쪽까지 번짐
scores.add(10);                                 // 컴파일 오류
`,
          good: String.raw`
List<Integer> findScores() { ... }

// 와일드카드는 받는 쪽에만
double average(List<? extends Number> scores) { ... }
`,
        },
        {
          id: 'l9', short: `공통 인터페이스`,
          title: `타입만 다른 중복은 제네릭 인터페이스로`,
          why: `타입 이름만 바꿔 복사한 코드는 제네릭으로 한 번만 씁니다. 공통 기능을 한 곳에서 다룰 수 있게 됩니다.`,
          bad: String.raw`
class UserRepository {
    User findById(long id) { ... }
    void save(User user) { ... }
}

class OrderRepository {
    Order findById(long id) { ... }   // 타입만 다른 같은 코드
    void save(Order order) { ... }
}
`,
          good: String.raw`
interface Repository<T, ID> {
    Optional<T> findById(ID id);
    void save(T entity);
}

class UserRepository implements Repository<User, Long> { ... }
class OrderRepository implements Repository<Order, Long> { ... }
`,
        },
        {
          id: 'l10', short: `여러 값 반환`,
          title: `여러 값을 돌려줄 때는 record`,
          why: `Object 배열이나 Map으로 여러 값을 돌려주면 순서와 타입을 외워야 합니다. record는 이름과 타입이 그대로 남습니다.`,
          bad: String.raw`
Object[] findMinMax(List<Integer> nums) {
    return new Object[] { Collections.min(nums), Collections.max(nums) };
}

Object[] r = findMinMax(nums);
int min = (Integer) r[0];   // 순서와 타입을 외워야 함
`,
          good: String.raw`
record MinMax(int min, int max) {}

MinMax findMinMax(List<Integer> nums) {
    return new MinMax(Collections.min(nums), Collections.max(nums));
}

int min = findMinMax(nums).min();

// 범용으로 필요하면 제네릭 record
record Pair<A, B>(A first, B second) {}
`,
        },
      ],
    },
    {
      id: 'java-12', no: 12, name: `파일과 입출력`,
      lead: `파일을 읽고 쓰는 코드의 습관입니다. java.io.File 시절의 방식 대신 Path와 Files를 쓰면 코드가 짧아지고 실패 원인도 분명해집니다.`,
      lessons: [
        {
          id: 'l1', short: `Path · Files`,
          title: `File 대신 Path와 Files`,
          why: `File의 메서드는 실패해도 false만 돌려주고 이유를 알려 주지 않습니다. Files는 원인이 담긴 예외를 던지고, Path는 구분자를 알아서 처리합니다.`,
          bad: String.raw`
File file = new File(dir + "/" + name);   // 구분자를 직접 붙임
if (file.exists()) {
    boolean ok = file.delete();           // 실패해도 false만. 이유를 모름
}
`,
          good: String.raw`
Path path = Path.of(dir, name);
if (Files.exists(path)) {
    Files.delete(path);                   // 실패하면 이유가 담긴 예외
}

Path parent = path.getParent();
String fileName = path.getFileName().toString();
`,
        },
        {
          id: 'l2', short: `readString`,
          title: `작은 파일은 한 줄로 읽기`,
          ver: `Java 11+`,
          why: `설정 파일이나 템플릿처럼 작은 파일은 반복문 없이 한 번에 읽습니다.`,
          bad: String.raw`
StringBuilder sb = new StringBuilder();
try (BufferedReader br = new BufferedReader(new FileReader("memo.txt"))) {
    String line;
    while ((line = br.readLine()) != null) {
        sb.append(line).append("\n");
    }
}
String text = sb.toString();
`,
          good: String.raw`
String text = Files.readString(Path.of("memo.txt"));

List<String> lines = Files.readAllLines(Path.of("memo.txt"));
`,
        },
        {
          id: 'l3', short: `Files.lines`,
          title: `큰 파일은 한 줄씩 흘려 읽기`,
          why: `readAllLines는 파일 전체를 메모리에 올립니다. 로그처럼 큰 파일은 스트림으로 한 줄씩 읽고 버립니다.`,
          bad: String.raw`
List<String> lines = Files.readAllLines(Path.of("access.log"));   // 5GB면 OutOfMemoryError

long errors = 0;
for (String line : lines) {
    if (line.contains("ERROR")) errors++;
}
`,
          good: String.raw`
try (Stream<String> lines = Files.lines(Path.of("access.log"))) {
    long errors = lines.filter(line -> line.contains("ERROR")).count();
}
// 파일을 물고 있는 스트림이므로 try-with-resources로 꼭 닫는다
`,
        },
        {
          id: 'l4', short: `인코딩`,
          title: `문자 인코딩을 명시하기`,
          why: `인코딩을 생략하면 실행 환경의 기본값을 따릅니다. 내 윈도우 PC에서는 되고 리눅스 서버에서는 한글이 깨지는 이유입니다.`,
          bad: String.raw`
Reader reader = new FileReader("data.csv");   // OS 기본 인코딩으로 읽음
byte[] bytes = text.getBytes();               // 윈도우는 MS949, 리눅스는 UTF-8
String s = new String(bytes);
`,
          good: String.raw`
Reader reader = Files.newBufferedReader(Path.of("data.csv"), StandardCharsets.UTF_8);
byte[] bytes = text.getBytes(StandardCharsets.UTF_8);
String s = new String(bytes, StandardCharsets.UTF_8);
`,
          note: `Java 18부터 기본 인코딩이 UTF-8로 통일됐습니다. 그래도 <strong>명시해 두면 어느 버전에서나 같은 결과</strong>가 나옵니다.`,
        },
        {
          id: 'l5', short: `복사`,
          title: `1바이트씩 읽지 말고 통째로 복사`,
          why: `read()를 한 바이트씩 부르면 그때마다 디스크에 접근합니다. Files.copy와 transferTo는 내부에서 버퍼 단위로 옮깁니다.`,
          bad: String.raw`
try (InputStream in = new FileInputStream(src);
     OutputStream out = new FileOutputStream(dst)) {
    int b;
    while ((b = in.read()) != -1) {   // 1바이트마다 디스크 접근
        out.write(b);
    }
}
`,
          good: String.raw`
Files.copy(Path.of(src), Path.of(dst), StandardCopyOption.REPLACE_EXISTING);

// 스트림끼리 옮길 때
try (InputStream in = url.openStream();
     OutputStream out = Files.newOutputStream(Path.of(dst))) {
    in.transferTo(out);
}
`,
        },
        {
          id: 'l6', short: `writeString`,
          title: `파일 쓰기도 Files로`,
          ver: `Java 11+`,
          why: `FileWriter를 직접 열고 닫으면 닫기를 빠뜨리기 쉽고 인코딩도 지정되지 않습니다. 옵션으로 "없으면 만들고 뒤에 붙인다"를 드러냅니다.`,
          bad: String.raw`
FileWriter writer = new FileWriter("app.log", true);
writer.write(message + "\n");
writer.close();   // 예외가 나면 안 닫힘
`,
          good: String.raw`
Files.writeString(Path.of("app.log"), message + System.lineSeparator(),
        StandardCharsets.UTF_8,
        StandardOpenOption.CREATE, StandardOpenOption.APPEND);
`,
        },
        {
          id: 'l7', short: `Files.walk`,
          title: `폴더 순회는 Files.walk`,
          why: `listFiles는 권한이 없거나 폴더가 아니면 null을 돌려줍니다. 재귀를 직접 쓰지 않고 스트림으로 하위 폴더까지 훑습니다.`,
          bad: String.raw`
void collect(File dir, List<File> result) {
    for (File f : dir.listFiles()) {   // null일 수 있음 : NullPointerException
        if (f.isDirectory()) collect(f, result);
        else if (f.getName().endsWith(".java")) result.add(f);
    }
}
`,
          good: String.raw`
try (Stream<Path> paths = Files.walk(root)) {
    List<Path> javaFiles = paths
            .filter(Files::isRegularFile)
            .filter(p -> p.toString().endsWith(".java"))
            .toList();
}
`,
        },
        {
          id: 'l8', short: `임시 파일`,
          title: `임시 파일은 만들고 반드시 지우기`,
          why: `이름을 고정하면 동시에 들어온 요청이 서로 덮어씁니다. 겹치지 않는 이름으로 만들고 finally에서 지웁니다.`,
          bad: String.raw`
File temp = new File("C:/temp/upload.tmp");   // 이름 고정 : 동시 요청이 서로 덮어씀
write(temp, data);
process(temp);
// 지우지 않음 : 디스크에 계속 쌓임
`,
          good: String.raw`
Path temp = Files.createTempFile("upload-", ".tmp");   // 겹치지 않는 이름
try {
    Files.write(temp, data);
    process(temp);
} finally {
    Files.deleteIfExists(temp);
}
`,
        },
        {
          id: 'l9', short: `클래스패스`,
          title: `리소스 파일은 클래스패스에서 읽기`,
          why: `src/main/resources 경로로 읽으면 IDE에서는 되지만 jar로 묶으면 그 경로가 없습니다. 클래스패스 기준으로 읽으면 어디서든 동작합니다.`,
          bad: String.raw`
// IDE에서는 되지만 jar로 묶어 실행하면 파일이 없음
File file = new File("src/main/resources/config.json");
String json = Files.readString(file.toPath());
`,
          good: String.raw`
try (InputStream in = App.class.getResourceAsStream("/config.json")) {
    if (in == null) {
        throw new IllegalStateException("config.json이 클래스패스에 없음");
    }
    String json = new String(in.readAllBytes(), StandardCharsets.UTF_8);
}
`,
        },
        {
          id: 'l10', short: `안전한 덮어쓰기`,
          title: `중요한 파일은 임시 파일에 쓰고 바꿔치기`,
          why: `쓰는 도중에 프로세스가 죽으면 반쯤 쓰인 파일이 남습니다. 옆에 다 써 놓고 이름을 한 번에 바꾸면 읽는 쪽은 옛 파일 아니면 새 파일만 봅니다.`,
          bad: String.raw`
// 쓰는 도중에 죽으면 반쯤 쓰인 설정 파일이 남음
Files.writeString(Path.of("settings.json"), json);
`,
          good: String.raw`
Path target = Path.of("settings.json").toAbsolutePath();
Path temp = Files.createTempFile(target.getParent(), "settings-", ".tmp");

Files.writeString(temp, json);
Files.move(temp, target,
        StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
`,
        },
      ],
    },
    {
      id: 'java-13', no: 13, name: `날짜와 시간`,
      lead: `3회차 05번의 java.time을 실제 업무 코드에 쓰는 방법입니다. 날짜 버그는 평소에는 멀쩡하다가 월말, 연말, 자정, 해외 사용자에서 터집니다.`,
      lessons: [
        {
          id: 'l1', short: `타입 고르기`,
          title: `담을 값에 맞는 타입 고르기`,
          why: `생일에 시각이 붙어 있거나 결제 시각에 시간대가 없으면 나중에 반드시 문제가 됩니다. 값의 성격에 맞는 타입이 따로 있습니다.`,
          bad: String.raw`
LocalDateTime birthday;      // 생일에 시각이 왜 필요한가
LocalDateTime paidAt;        // 어느 나라 시간인지 알 수 없음
String openTime = "09:00";   // 문자열로는 계산을 못 함
`,
          good: String.raw`
LocalDate birthday;          // 날짜만
LocalTime openTime;          // 시각만
Instant paidAt;              // 전 세계 공통의 한 순간 : 기록, 저장
ZonedDateTime meetingAt;     // 특정 지역의 날짜와 시각 : 예약, 표시
Duration timeout;            // 시간의 길이
`,
        },
        {
          id: 'l2', short: `Period · Duration`,
          title: `기간 계산은 직접 나누지 않기`,
          why: `밀리초를 직접 나누는 계산은 서머타임이 낀 날에 하루가 어긋납니다. 날짜 단위는 Period, 시간 단위는 Duration이 맡습니다.`,
          bad: String.raw`
long days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

int months = (endYear - startYear) * 12 + (endMonth - startMonth);
`,
          good: String.raw`
long days = ChronoUnit.DAYS.between(startDate, endDate);

Period period = Period.between(startDate, endDate);        // 1년 2개월 3일
int years = period.getYears();

Duration elapsed = Duration.between(startTime, endTime);   // 3시간 20분
long minutes = elapsed.toMinutes();
`,
        },
        {
          id: 'l3', short: `비교`,
          title: `날짜 비교는 isBefore, isAfter`,
          why: `compareTo의 부호를 해석하는 것보다 메서드 이름이 그대로 읽힙니다. 양 끝을 포함하는 범위 검사는 정해진 모양이 있습니다.`,
          bad: String.raw`
if (date.compareTo(start) >= 0 && date.compareTo(end) <= 0) { ... }

if (a.equals(b)) { ... }   // ZonedDateTime은 시간대가 다르면 같은 순간이어도 false
`,
          good: String.raw`
boolean inRange = !date.isBefore(start) && !date.isAfter(end);   // 양 끝 포함

if (a.isEqual(b)) { ... }   // 같은 순간인지 비교

if (deadline.isBefore(LocalDate.now())) { ... }
`,
        },
        {
          id: 'l4', short: `월말 · 요일`,
          title: `월말과 요일 계산을 직접 하지 않기`,
          why: `달마다 일수가 다르고 윤년이 있습니다. 직접 계산하면 반드시 빠뜨리는 경우가 생기므로 라이브러리에 맡깁니다.`,
          bad: String.raw`
int lastDay = (month == 2) ? 28
        : (month == 4 || month == 6 || month == 9 || month == 11) ? 30 : 31;   // 윤년 빠짐

LocalDate next = LocalDate.of(year, month + 1, day);   // 12월이면 예외, 1월 31일도 예외
`,
          good: String.raw`
LocalDate lastDay = date.with(TemporalAdjusters.lastDayOfMonth());
LocalDate nextMonday = date.with(TemporalAdjusters.next(DayOfWeek.MONDAY));

LocalDate next = date.plusMonths(1);   // 1월 31일 + 1개월 = 2월 말일로 맞춰 줌
boolean leap = date.isLeapYear();
`,
        },
        {
          id: 'l5', short: `파싱`,
          title: `문자열을 날짜로 바꿀 때는 형식을 정하기`,
          why: `LocalDate.parse의 기본 형식은 2026-11-11 하나뿐입니다. 다른 형식은 포매터를 상수로 두고, 실패했을 때의 메시지도 준비합니다.`,
          bad: String.raw`
LocalDate date = LocalDate.parse("2026/11/11");   // DateTimeParseException

// 호출할 때마다 포매터를 새로 만듦
LocalDate d = LocalDate.parse(input, DateTimeFormatter.ofPattern("yyyy/MM/dd"));
`,
          good: String.raw`
private static final DateTimeFormatter SLASH = DateTimeFormatter.ofPattern("yyyy/MM/dd");

try {
    LocalDate date = LocalDate.parse(input, SLASH);
} catch (DateTimeParseException e) {
    throw new IllegalArgumentException("날짜 형식은 2026/11/11 : " + input, e);
}
`,
        },
        {
          id: 'l6', short: `Clock`,
          title: `현재 시각은 Clock으로 주입`,
          why: `코드 안에서 now()를 직접 부르면 테스트 결과가 실행한 날짜에 따라 달라집니다. Clock을 주입받으면 테스트에서 시간을 고정할 수 있습니다.`,
          bad: String.raw`
public boolean isExpired(Coupon coupon) {
    return coupon.getExpireDate().isBefore(LocalDate.now());   // 오늘이 언제냐에 따라 결과가 바뀜
}
`,
          good: String.raw`
private final Clock clock;   // 생성자로 주입

public boolean isExpired(Coupon coupon) {
    return coupon.getExpireDate().isBefore(LocalDate.now(clock));
}

// 운영 : Clock.systemDefaultZone()
// 테스트 : 시간을 고정
Clock fixed = Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneId.of("Asia/Seoul"));
`,
        },
        {
          id: 'l7', short: `하루의 범위`,
          title: `하루는 "0시 이상, 다음 날 0시 미만"`,
          why: `23:59:59까지로 잡으면 마지막 1초 안에 생긴 데이터가 빠집니다. 끝을 다음 날 0시로 잡고 "미만"으로 비교하면 빈틈이 없습니다.`,
          bad: String.raw`
LocalDateTime from = date.atTime(0, 0, 0);
LocalDateTime to = date.atTime(23, 59, 59);   // 23:59:59.5에 생긴 데이터가 빠짐

// WHERE created_at BETWEEN :from AND :to
`,
          good: String.raw`
LocalDateTime from = date.atStartOfDay();
LocalDateTime to = date.plusDays(1).atStartOfDay();   // 다음 날 0시

// WHERE created_at >= :from AND created_at < :to
`,
        },
        {
          id: 'l8', short: `시간대 변환`,
          title: `시간대는 더하고 빼지 않기`,
          why: `"한국은 9시간 더하기"는 한국에서만 맞습니다. 서머타임이 있는 지역은 계절마다 차이가 달라지므로 지역 이름으로 변환합니다.`,
          bad: String.raw`
LocalDateTime utc = LocalDateTime.now(ZoneOffset.UTC);
LocalDateTime seoul = utc.plusHours(9);
LocalDateTime newYork = utc.minusHours(5);   // 여름에는 4시간 차이
`,
          good: String.raw`
Instant now = Instant.now();

ZonedDateTime seoul = now.atZone(ZoneId.of("Asia/Seoul"));
ZonedDateTime newYork = now.atZone(ZoneId.of("America/New_York"));   // 서머타임 자동 반영

ZonedDateTime london = seoul.withZoneSameInstant(ZoneId.of("Europe/London"));
`,
        },
        {
          id: 'l9', short: `Date 변환`,
          title: `옛 Date는 경계에서 바로 변환`,
          why: `오래된 라이브러리가 Date를 돌려주더라도 그대로 들고 다니지 않습니다. 받는 자리에서 바로 바꾸고 안쪽 코드는 java.time만 씁니다.`,
          bad: String.raw`
Date legacy = api.getCreatedAt();
int year = legacy.getYear() + 1900;   // 폐기된 메서드, 1900을 더해야 함
int month = legacy.getMonth() + 1;    // 0부터 시작
`,
          good: String.raw`
LocalDate date = legacy.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();

Date back = Date.from(date.atStartOfDay(ZoneId.systemDefault()).toInstant());

LocalDateTime fromDb = timestamp.toLocalDateTime();   // java.sql.Timestamp
`,
        },
        {
          id: 'l10', short: `nanoTime`,
          title: `걸린 시간은 nanoTime으로 재기`,
          why: `currentTimeMillis는 "지금 몇 시인가"라서 시스템 시계가 조정되면 값이 튀거나 음수가 됩니다. 경과 시간 측정에는 nanoTime을 씁니다.`,
          bad: String.raw`
long start = System.currentTimeMillis();   // 시계가 조정되면 음수도 나옴
run();
long took = System.currentTimeMillis() - start;
`,
          good: String.raw`
long start = System.nanoTime();            // 경과 시간 측정 전용
run();
Duration took = Duration.ofNanos(System.nanoTime() - start);

log.info("처리 시간 {}ms", took.toMillis());
`,
        },
      ],
    },
    {
      id: 'java-14', no: 14, name: `문자열 다루기`,
      lead: `가장 자주 쓰는 타입인 String의 습관입니다. 비어 있는지 검사하기, 비교하기, 조립하기처럼 매일 쓰는 코드가 대상입니다.`,
      lessons: [
        {
          id: 'l1', short: `isBlank`,
          title: `빈 문자열 검사는 isBlank`,
          ver: `Java 11+`,
          why: `길이 검사와 trim을 직접 조합하지 않습니다. isEmpty는 길이만, isBlank는 공백을 빼고 봅니다.`,
          bad: String.raw`
if (name == null || name.length() == 0 || name.trim().equals("")) { ... }
`,
          good: String.raw`
if (name == null || name.isBlank()) { ... }

"".isEmpty();     // true
"  ".isEmpty();   // false : 길이만 봄
"  ".isBlank();   // true  : 공백을 빼고 봄
`,
        },
        {
          id: 'l2', short: `대소문자`,
          title: `대소문자 무시 비교와 Locale`,
          why: `소문자로 바꿔 비교하면 문자열을 새로 만들고 null에서 터집니다. 그리고 toUpperCase는 서버의 언어 설정에 따라 결과가 달라질 수 있습니다.`,
          bad: String.raw`
if (input.toLowerCase().equals("yes")) { ... }   // input이 null이면 예외

String key = name.toUpperCase();   // 터키어 환경에서는 i가 다른 글자로 바뀜
`,
          good: String.raw`
if ("yes".equalsIgnoreCase(input)) { ... }

String key = name.toUpperCase(Locale.ROOT);   // 어느 나라 서버에서나 같은 결과
`,
        },
        {
          id: 'l3', short: `join · format`,
          title: `이어 붙이기와 숫자 서식`,
          why: `구분자를 넣으려고 마지막인지 검사하는 반복문을 쓰지 않습니다. 천 단위 쉼표, 소수 자리, 0 채우기는 서식 문자열로 합니다.`,
          bad: String.raw`
String s = "";
for (int i = 0; i < tags.size(); i++) {
    s += tags.get(i);
    if (i < tags.size() - 1) s += ", ";
}

String price = amount + "원";   // 1500000원
`,
          good: String.raw`
String s = String.join(", ", tags);

String price = String.format("%,d원", amount);   // 1,500,000원
String rate = "%.1f%%".formatted(ratio * 100);   // 12.5%
String id = String.format("%05d", seq);          // 00042
`,
        },
        {
          id: 'l4', short: `repeat · lines · strip`,
          title: `repeat, lines, strip 쓰기`,
          ver: `Java 11+`,
          why: `자주 하는 일은 이미 메서드로 있습니다. lines는 윈도우와 리눅스의 줄바꿈을 모두 처리하고, strip은 유니코드 공백까지 지웁니다.`,
          bad: String.raw`
String line = "";
for (int i = 0; i < 20; i++) line += "-";

String[] rows = text.split("\n");   // 윈도우 줄바꿈이면 줄 끝에 \r이 남음
String clean = input.trim();        // 전각 공백은 못 지움
`,
          good: String.raw`
String line = "-".repeat(20);

List<String> rows = text.lines().toList();
String clean = input.strip();
`,
        },
        {
          id: 'l5', short: `숫자 변환`,
          title: `문자열과 숫자 사이의 변환`,
          why: `빈 문자열을 더해 변환하는 것은 의도가 안 보입니다. 사용자가 입력한 문자열을 숫자로 바꿀 때는 실패했을 때의 메시지를 준비합니다.`,
          bad: String.raw`
String s = "" + count;               // 의도가 불분명
Integer n = new Integer("42");       // 폐기된 생성자
int age = Integer.parseInt(input);   // "abc"면 NumberFormatException이 그대로 위로
`,
          good: String.raw`
String s = String.valueOf(count);
int n = Integer.parseInt("42");

int age;
try {
    age = Integer.parseInt(input.strip());
} catch (NumberFormatException e) {
    throw new IllegalArgumentException("나이는 숫자로 입력: " + input, e);
}
`,
        },
        {
          id: 'l6', short: `Pattern`,
          title: `반복해서 쓰는 정규식은 미리 컴파일`,
          why: `String.matches는 부를 때마다 정규식을 새로 해석합니다. 반복문이나 자주 불리는 메서드에서는 Pattern을 상수로 둡니다.`,
          bad: String.raw`
for (String line : lines) {
    if (line.matches("\\d{3}-\\d{4}-\\d{4}")) {   // 줄마다 정규식을 새로 컴파일
        count++;
    }
}
`,
          good: String.raw`
private static final Pattern PHONE = Pattern.compile("\\d{3}-\\d{4}-\\d{4}");

for (String line : lines) {
    if (PHONE.matcher(line).matches()) {
        count++;
    }
}
`,
        },
        {
          id: 'l7', short: `contains · startsWith`,
          title: `indexOf 대신 뜻이 드러나는 메서드`,
          why: `indexOf의 결과를 0이나 -1과 비교하는 코드는 한 번 더 생각해야 읽힙니다. 같은 일을 하는 이름 있는 메서드가 있습니다.`,
          bad: String.raw`
if (url.indexOf("https") == 0) { ... }
if (name.indexOf("test") != -1) { ... }
if (file.substring(file.length() - 4).equals(".jpg")) { ... }   // 4글자보다 짧으면 예외
`,
          good: String.raw`
if (url.startsWith("https")) { ... }
if (name.contains("test")) { ... }
if (file.endsWith(".jpg")) { ... }
`,
        },
        {
          id: 'l8', short: `이모지`,
          title: `length는 글자 수가 아니다`,
          why: `이모지와 일부 한자는 char 두 개로 저장됩니다. length로 글자 수를 세거나 charAt으로 자르면 글자가 반으로 쪼개집니다.`,
          bad: String.raw`
String s = "A😀";

s.length();          // 3 : 이모지 하나가 char 두 개
s.charAt(1);         // 깨진 반쪽 문자
s.substring(0, 2);   // "A" 뒤에 반쪽이 붙어 깨짐
`,
          good: String.raw`
s.codePointCount(0, s.length());   // 2 : 사람이 보는 글자 수

s.codePoints().forEach(cp ->
        System.out.println(Character.toString(cp)));   // A, 😀
`,
          note: `닉네임 글자 수 제한, 문자 메시지 자르기처럼 <strong>사용자가 입력한 글을 세거나 자를 때</strong> 문제가 됩니다.`,
        },
        {
          id: 'l9', short: `불변`,
          title: `String 메서드는 결과를 받아야 한다`,
          why: `String은 바뀌지 않습니다. trim이나 replace는 원본을 고치는 것이 아니라 새 문자열을 돌려주므로, 받지 않으면 아무 일도 일어나지 않습니다.`,
          bad: String.raw`
String name = "  kim  ";
name.trim();               // 결과를 버림 : name은 그대로
name.toUpperCase();
name.replace("k", "K");
`,
          good: String.raw`
String name = "  kim  ";
name = name.trim();        // 새 문자열을 받는다

String result = name.trim().toUpperCase();   // 이어서 써도 됨
`,
        },
        {
          id: 'l10', short: `Set.contains`,
          title: `여러 값 중 하나인지는 Set으로`,
          why: `equals를 ||로 길게 잇는 대신 허용하는 값을 모아 두고 포함 여부를 묻습니다. 값이 늘어도 조건문은 그대로입니다.`,
          bad: String.raw`
if (ext.equals("jpg") || ext.equals("jpeg") || ext.equals("png") || ext.equals("gif")) { ... }
`,
          good: String.raw`
private static final Set<String> IMAGE_EXTENSIONS = Set.of("jpg", "jpeg", "png", "gif");

if (IMAGE_EXTENSIONS.contains(ext.toLowerCase(Locale.ROOT))) { ... }
`,
        },
      ],
    },
    {
      id: 'java-15', no: 15, name: `enum과 애너테이션`,
      lead: `2회차 04번에서 상수 대신 enum을 쓰기로 했습니다. 여기서는 enum에 값과 동작을 담는 방법, 그리고 컴파일러가 실수를 잡아 주게 하는 애너테이션을 다룹니다.`,
      lessons: [
        {
          id: 'l1', short: `enum에 동작`,
          title: `enum마다 다른 동작은 enum 안에`,
          why: `enum 값에 따라 분기하는 switch가 여러 곳에 있으면 상수를 추가할 때마다 전부 찾아 고쳐야 합니다. 동작을 상수와 함께 두면 빠뜨릴 수 없습니다.`,
          bad: String.raw`
enum Operation { PLUS, MINUS, TIMES }

int apply(Operation op, int a, int b) {
    switch (op) {
        case PLUS:  return a + b;
        case MINUS: return a - b;
        case TIMES: return a * b;
        default: throw new IllegalStateException();   // 상수를 추가하면 여기도 고쳐야 함
    }
}
`,
          good: String.raw`
enum Operation {
    PLUS((a, b) -> a + b),
    MINUS((a, b) -> a - b),
    TIMES((a, b) -> a * b);

    private final IntBinaryOperator function;

    Operation(IntBinaryOperator function) { this.function = function; }

    public int apply(int a, int b) { return function.applyAsInt(a, b); }
}

int result = Operation.PLUS.apply(2, 3);
`,
        },
        {
          id: 'l2', short: `ordinal`,
          title: `ordinal을 저장하지 않기`,
          why: `ordinal은 선언 순서입니다. 중간에 상수를 끼워 넣거나 순서를 바꾸면 저장해 둔 숫자의 뜻이 전부 바뀝니다. 저장할 값은 필드로 직접 정합니다.`,
          bad: String.raw`
enum Grade { BRONZE, SILVER, GOLD }

int saved = grade.ordinal();            // DB에 0, 1, 2로 저장
Grade loaded = Grade.values()[saved];   // 중간에 상수를 넣으면 전부 밀림
`,
          good: String.raw`
enum Grade {
    BRONZE("B"), SILVER("S"), GOLD("G");

    private final String code;

    Grade(String code) { this.code = code; }

    public String code() { return code; }
}

String saved = grade.code();   // 순서를 바꿔도, 상수 이름을 바꿔도 안전
`,
        },
        {
          id: 'l3', short: `EnumSet · EnumMap`,
          title: `비트 플래그 대신 EnumSet`,
          why: `정수 비트 연산은 출력하면 숫자만 보이고 엉뚱한 값도 들어갑니다. EnumSet은 내부적으로 비트를 쓰면서도 읽기 쉽고 타입이 안전합니다.`,
          bad: String.raw`
static final int READ = 1, WRITE = 2, DELETE = 4;

int permissions = READ | WRITE;            // 출력하면 3
if ((permissions & DELETE) != 0) { ... }

Map<Day, List<Task>> tasks = new HashMap<>();
`,
          good: String.raw`
enum Permission { READ, WRITE, DELETE }

Set<Permission> permissions = EnumSet.of(Permission.READ, Permission.WRITE);
if (permissions.contains(Permission.DELETE)) { ... }   // 출력하면 [READ, WRITE]

Map<Day, List<Task>> tasks = new EnumMap<>(Day.class);   // enum 키 전용 : 빠르고 순서 유지
`,
        },
        {
          id: 'l4', short: `안전한 변환`,
          title: `문자열을 enum으로 바꿀 때 조회 메서드 두기`,
          why: `valueOf는 이름이 정확히 일치하지 않으면 예외를 던집니다. 외부에서 온 값은 코드로 찾는 메서드를 따로 두고 없는 경우를 Optional로 돌려줍니다.`,
          bad: String.raw`
Grade grade = Grade.valueOf(input);   // "gold"나 "VIP"가 오면 IllegalArgumentException
`,
          good: String.raw`
enum Grade {
    BRONZE("B"), SILVER("S"), GOLD("G");

    private static final Map<String, Grade> BY_CODE = Arrays.stream(values())
            .collect(Collectors.toMap(Grade::code, Function.identity()));

    public static Optional<Grade> fromCode(String code) {
        return Optional.ofNullable(BY_CODE.get(code));
    }
    // 필드와 생성자는 앞 항목과 같음
}

Grade grade = Grade.fromCode(input).orElse(Grade.BRONZE);
`,
        },
        {
          id: 'l5', short: `== 비교`,
          title: `enum 비교는 ==`,
          why: `enum 상수는 하나씩만 존재하므로 ==로 비교해도 됩니다. null에서 안전하고, 타입이 다른 값과 비교하면 컴파일 오류로 알려 줍니다.`,
          bad: String.raw`
if (order.getStatus().equals(Status.PAID)) { ... }   // status가 null이면 NullPointerException

if (order.getStatus().equals("PAID")) { ... }        // 컴파일은 되지만 항상 false
`,
          good: String.raw`
if (order.getStatus() == Status.PAID) { ... }   // null이어도 안전

// order.getStatus() == "PAID"  →  타입이 달라 컴파일 오류로 잡힘
`,
        },
        {
          id: 'l6', short: `상태 전이`,
          title: `상태 전이 규칙은 enum이 알게 하기`,
          why: `"이 상태에서 저 상태로 갈 수 있는가"가 서비스 곳곳의 if에 흩어지면 규칙이 서로 어긋납니다. 규칙을 상태 자신에게 둡니다.`,
          bad: String.raw`
// 전이 규칙이 서비스 곳곳에 흩어져 있음
if (order.getStatus() == Status.CREATED || order.getStatus() == Status.PAID) {
    order.setStatus(Status.CANCELED);
}
`,
          good: String.raw`
enum Status {
    CREATED, PAID, SHIPPED, CANCELED;

    public boolean canMoveTo(Status next) {
        return switch (this) {
            case CREATED -> next == PAID || next == CANCELED;
            case PAID    -> next == SHIPPED || next == CANCELED;
            case SHIPPED, CANCELED -> false;
        };
    }
}

if (!order.getStatus().canMoveTo(Status.CANCELED)) {
    throw new IllegalStateException("취소할 수 없는 상태: " + order.getStatus());
}
`,
        },
        {
          id: 'l7', short: `@Override`,
          title: `재정의에는 항상 @Override`,
          why: `매개변수 타입이나 철자가 조금만 달라도 재정의가 아니라 새 메서드가 됩니다. @Override를 붙이면 그 실수를 컴파일러가 잡습니다.`,
          bad: String.raw`
class User {
    public boolean equals(User other) {   // 재정의가 아님 : 매개변수가 Object가 아니다
        return id == other.id;
    }
    public int hashcode() { return 1; }   // 오타 : hashCode가 아니다
}
`,
          good: String.raw`
class User {
    @Override
    public boolean equals(Object o) { ... }

    @Override
    public int hashCode() { ... }
}
// @Override를 붙였는데 재정의가 아니면 컴파일 오류
`,
        },
        {
          id: 'l8', short: `@Deprecated`,
          title: `없앨 메서드는 @Deprecated와 대안 안내`,
          why: `주석으로 "쓰지 마세요"라고 적어도 아무도 보지 않습니다. @Deprecated는 IDE가 취소선과 경고로 보여 주고, 문서 주석으로 대신 쓸 것을 알려 줍니다.`,
          bad: String.raw`
// 쓰지 마세요!! sendV2 쓰세요
public void send(String to, String body) { ... }
`,
          good: String.raw`
/**
 * @deprecated 첨부 파일을 지원하는 {@link #send(Mail)} 를 쓰세요.
 */
@Deprecated(since = "2.3", forRemoval = true)
public void send(String to, String body) { ... }

public void send(Mail mail) { ... }
`,
        },
        {
          id: 'l9', short: `@FunctionalInterface`,
          title: `람다용 인터페이스에는 @FunctionalInterface`,
          why: `람다로 쓰려고 만든 인터페이스에 누군가 메서드를 하나 더 추가하면 람다로 쓰던 코드가 전부 깨집니다. 애너테이션이 그 추가를 막습니다.`,
          bad: String.raw`
interface Validator<T> {
    boolean validate(T value);
}
// 메서드를 하나 더 추가하면, 람다로 쓰던 곳이 전부 컴파일 오류
`,
          good: String.raw`
@FunctionalInterface
interface Validator<T> {
    boolean validate(T value);
    // 추상 메서드를 하나 더 넣으면 바로 여기서 컴파일 오류
}

Validator<String> notBlank = s -> !s.isBlank();
`,
        },
        {
          id: 'l10', short: `@Nullable`,
          title: `null 가능성은 주석 말고 애너테이션으로`,
          ver: `@Nullable`,
          why: `"null일 수 있음"이라는 주석은 호출하는 사람 눈에 띄지 않습니다. 애너테이션으로 표시하면 IDE가 호출하는 자리에서 경고합니다.`,
          bad: String.raw`
// 없으면 null을 반환함
User findByEmail(String email) { ... }

String name = findByEmail(email).getName();   // 주석은 아무도 안 읽음
`,
          good: String.raw`
@Nullable
User findByEmail(String email) { ... }

String name = findByEmail(email).getName();   // IDE가 "null일 수 있음" 경고
`,
          note: `@Nullable은 JSpecify, JetBrains, 스프링 등 여러 라이브러리가 제공합니다. 새로 만드는 메서드라면 <strong>Optional 반환</strong>이 더 확실합니다.`,
        },
      ],
    },
    {
      id: 'java-16', no: 16, name: `JDBC와 SQL`,
      lead: `자바에서 데이터베이스를 다룰 때의 습관입니다. JPA나 MyBatis를 쓰더라도 그 밑에서 일어나는 일은 같아서, 여기 나오는 문제는 그대로 나타납니다.`,
      lessons: [
        {
          id: 'l1', short: `PreparedStatement`,
          title: `SQL에 값을 이어 붙이지 않기`,
          why: `입력값을 문자열로 이어 붙이면 입력이 SQL의 일부로 실행됩니다. 물음표 자리에 값을 따로 넘기면 값은 값으로만 처리됩니다.`,
          bad: String.raw`
String sql = "SELECT * FROM users WHERE name = '" + name + "'";
// name에  ' OR '1'='1  이 들어오면 전체 회원이 조회됨
ResultSet rs = statement.executeQuery(sql);
`,
          good: String.raw`
String sql = "SELECT id, name FROM users WHERE name = ?";

try (PreparedStatement ps = con.prepareStatement(sql)) {
    ps.setString(1, name);   // 값은 값으로만 전달된다
    try (ResultSet rs = ps.executeQuery()) { ... }
}
`,
        },
        {
          id: 'l2', short: `커넥션 풀`,
          title: `커넥션은 풀에서 빌려 쓰기`,
          ver: `HikariCP`,
          why: `DB 접속은 쿼리 실행보다 훨씬 오래 걸립니다. 미리 만들어 둔 커넥션을 빌려 쓰고 돌려주면 접속 비용이 사라지고 동시 접속 수도 제한됩니다.`,
          bad: String.raw`
public User find(long id) throws SQLException {
    // 요청마다 DB에 새로 접속
    Connection con = DriverManager.getConnection(url, user, password);
    ...
}
`,
          good: String.raw`
// 애플리케이션을 시작할 때 한 번
HikariConfig config = new HikariConfig();
config.setJdbcUrl(url);
config.setMaximumPoolSize(10);
DataSource dataSource = new HikariDataSource(config);

// 쓸 때마다 풀에서 빌리고, close하면 풀로 돌아간다
try (Connection con = dataSource.getConnection()) { ... }
`,
        },
        {
          id: 'l3', short: `트랜잭션`,
          title: `함께 성공해야 하는 작업은 트랜잭션으로`,
          why: `출금은 됐는데 입금에서 실패하면 돈이 사라집니다. 둘을 하나의 트랜잭션으로 묶어 모두 반영되거나 모두 취소되게 합니다.`,
          bad: String.raw`
withdraw(con, fromId, amount);   // 여기까지 반영된 뒤
deposit(con, toId, amount);      // 여기서 예외가 나면 돈이 사라짐
`,
          good: String.raw`
con.setAutoCommit(false);
try {
    withdraw(con, fromId, amount);
    deposit(con, toId, amount);
    con.commit();      // 둘 다 성공해야 반영
} catch (SQLException e) {
    con.rollback();    // 하나라도 실패하면 둘 다 취소
    throw e;
}
`,
          note: `스프링에서는 메서드에 <strong>@Transactional</strong>을 붙이면 같은 일을 해 줍니다.`,
        },
        {
          id: 'l4', short: `N+1`,
          title: `반복문 안에서 쿼리하지 않기`,
          why: `목록을 조회한 뒤 한 건마다 다시 조회하면 쿼리가 건수만큼 나갑니다. 필요한 id를 모아 한 번에 가져옵니다.`,
          bad: String.raw`
List<Order> orders = findOrders();             // 쿼리 1번
for (Order order : orders) {
    User user = findUser(order.getUserId());   // 주문 수만큼 쿼리 : 100건이면 101번
    ...
}
`,
          good: String.raw`
List<Order> orders = findOrders();

Set<Long> userIds = orders.stream().map(Order::getUserId).collect(Collectors.toSet());
Map<Long, User> users = findUsersByIds(userIds);   // WHERE id IN (...) 한 번

for (Order order : orders) {
    User user = users.get(order.getUserId());
    ...
}
`,
        },
        {
          id: 'l5', short: `SELECT *`,
          title: `필요한 컬럼만, 이름으로 꺼내기`,
          why: `SELECT *는 쓰지 않는 컬럼까지 가져오고, 번호로 꺼내면 테이블에 컬럼이 추가될 때 순서가 밀려 엉뚱한 값을 읽습니다.`,
          bad: String.raw`
ResultSet rs = st.executeQuery("SELECT * FROM users");
while (rs.next()) {
    String name = rs.getString(2);   // 컬럼이 추가되면 순서가 밀림
}
`,
          good: String.raw`
ResultSet rs = st.executeQuery("SELECT id, name, email FROM users");
while (rs.next()) {
    String name = rs.getString("name");
}
`,
        },
        {
          id: 'l6', short: `배치`,
          title: `여러 건 저장은 배치로`,
          why: `한 건씩 실행하면 건수만큼 DB를 왕복합니다. 모아서 한 번에 보내면 왕복이 한 번으로 줄어듭니다.`,
          bad: String.raw`
for (Item item : items) {   // 1만 건이면 DB를 1만 번 왕복
    ps.setString(1, item.getName());
    ps.executeUpdate();
}
`,
          good: String.raw`
for (Item item : items) {
    ps.setString(1, item.getName());
    ps.addBatch();
}
ps.executeBatch();          // 모아서 한 번에 전송
`,
          note: `수십만 건이라면 <strong>1000건 단위로 끊어서</strong> executeBatch를 부릅니다. 한 번에 다 모으면 메모리가 부족해집니다.`,
        },
        {
          id: 'l7', short: `페이징`,
          title: `페이징은 DB에서`,
          why: `전부 가져온 뒤 자바에서 자르면 필요 없는 데이터까지 메모리에 올라옵니다. 필요한 만큼만 DB가 잘라서 주게 합니다.`,
          bad: String.raw`
List<Post> all = findAll();                           // 100만 건을 전부 메모리로
List<Post> page = all.subList(offset, offset + 20);   // 그중 20건만 사용
`,
          good: String.raw`
String sql = "SELECT id, title FROM posts ORDER BY id DESC LIMIT ? OFFSET ?";
ps.setInt(1, 20);
ps.setInt(2, offset);

// 뒤쪽 페이지가 느려지면 마지막으로 본 id를 기준으로 잡는다
// WHERE id < ? ORDER BY id DESC LIMIT 20
`,
        },
        {
          id: 'l8', short: `NULL`,
          title: `DB의 NULL을 0으로 읽지 않기`,
          why: `getInt는 값이 NULL이면 0을 돌려줍니다. 나이 0살과 "입력 안 함"이 구분되지 않습니다.`,
          bad: String.raw`
int age = rs.getInt("age");   // DB 값이 NULL이면 0
`,
          good: String.raw`
Integer age = rs.getObject("age", Integer.class);   // NULL이면 null

// 또는
int value = rs.getInt("age");
boolean missing = rs.wasNull();
`,
        },
        {
          id: 'l9', short: `날짜 컬럼`,
          title: `날짜 컬럼은 java.time으로 주고받기`,
          ver: `JDBC 4.2+`,
          why: `java.sql의 날짜 타입이 서비스 코드로 퍼지지 않게 합니다. 드라이버가 LocalDate, LocalDateTime을 직접 지원합니다.`,
          bad: String.raw`
java.sql.Timestamp ts = rs.getTimestamp("created_at");
Date created = new Date(ts.getTime());      // 옛 타입이 서비스 코드로 퍼짐

ps.setString(1, "2026-11-11 10:00:00");     // 날짜를 문자열로 넘김
`,
          good: String.raw`
LocalDateTime created = rs.getObject("created_at", LocalDateTime.class);

ps.setObject(1, LocalDateTime.of(2026, 11, 11, 10, 0));
`,
        },
        {
          id: 'l10', short: `ORDER BY`,
          title: `정렬 컬럼은 허용 목록에서 고르기`,
          why: `컬럼 이름은 물음표로 넘길 수 없어서 그대로 붙이게 됩니다. 사용자 입력을 직접 붙이지 말고 미리 정해 둔 값 중에서만 고릅니다.`,
          bad: String.raw`
// 입력을 그대로 붙임 : SQL 인젝션
String sql = "SELECT id, title FROM posts ORDER BY " + request.getParameter("sort");
`,
          good: String.raw`
private static final Map<String, String> SORT_COLUMNS = Map.of(
        "latest", "created_at DESC",
        "title",  "title ASC");

String orderBy = SORT_COLUMNS.getOrDefault(sortParam, "created_at DESC");
String sql = "SELECT id, title FROM posts ORDER BY " + orderBy;   // 허용한 값만 들어간다
`,
        },
      ],
    },
    {
      id: 'java-17', no: 17, name: `디자인 패턴`,
      lead: `이름난 패턴 가운데 실무에서 실제로 자주 쓰는 것들입니다. 패턴은 외우는 것이 아니라, 왼쪽 같은 불편함이 생겼을 때 꺼내는 해법입니다.`,
      lessons: [
        {
          id: 'l1', short: `전략`,
          title: `조건에 따라 바뀌는 규칙은 전략으로`,
          why: `정책이 늘 때마다 if를 하나씩 추가하면 메서드가 끝없이 길어집니다. 규칙을 인터페이스로 빼면 새 정책은 새 구현을 추가하는 것으로 끝납니다.`,
          bad: String.raw`
long discount(String grade, long price) {
    if (grade.equals("VIP")) return price * 20 / 100;
    else if (grade.equals("GOLD")) return price * 10 / 100;
    else if (grade.equals("COUPON")) return 3000;
    else return 0;   // 정책이 늘 때마다 이 메서드를 고침
}
`,
          good: String.raw`
interface DiscountPolicy {
    long discount(long price);
}

DiscountPolicy vip = price -> price * 20 / 100;
DiscountPolicy coupon = price -> 3000;

class OrderService {
    private final DiscountPolicy policy;   // 어떤 정책인지 몰라도 된다

    OrderService(DiscountPolicy policy) { this.policy = policy; }

    long pay(long price) { return price - policy.discount(price); }
}
`,
        },
        {
          id: 'l2', short: `감싸서 실행`,
          title: `반복되는 앞뒤 처리는 람다를 받는 메서드로`,
          why: `시간 측정, 락 잡기, 트랜잭션처럼 "앞에서 준비하고 뒤에서 정리"하는 뼈대가 메서드마다 복사됩니다. 뼈대를 한 번만 쓰고 가운데 할 일만 람다로 받습니다.`,
          bad: String.raw`
long start = System.nanoTime();
try {
    createOrder();
} finally {
    log.info("createOrder {}ms", (System.nanoTime() - start) / 1_000_000);
}
// 같은 뼈대가 메서드마다 복사됨
`,
          good: String.raw`
<T> T timed(String name, Supplier<T> action) {
    long start = System.nanoTime();
    try {
        return action.get();
    } finally {
        log.info("{} {}ms", name, (System.nanoTime() - start) / 1_000_000);
    }
}

Order order = timed("createOrder", () -> createOrder());
`,
        },
        {
          id: 'l3', short: `팩토리`,
          title: `객체를 고르는 분기는 한 곳에`,
          why: `어떤 구현을 만들지 고르는 if가 호출하는 곳마다 있으면 종류가 추가될 때 전부 찾아야 합니다. 만드는 일을 팩토리 한 곳에 모읍니다.`,
          bad: String.raw`
// 생성 분기가 호출하는 곳마다 흩어져 있음
Notifier notifier;
if (type.equals("sms")) notifier = new SmsNotifier(apiKey);
else if (type.equals("email")) notifier = new EmailNotifier(host, port);
else notifier = new PushNotifier(token);
`,
          good: String.raw`
class NotifierFactory {
    private final Map<String, Supplier<Notifier>> creators = Map.of(
            "sms",   () -> new SmsNotifier(apiKey),
            "email", () -> new EmailNotifier(host, port),
            "push",  () -> new PushNotifier(token));

    Notifier create(String type) {
        Supplier<Notifier> creator = creators.get(type);
        if (creator == null) {
            throw new IllegalArgumentException("모르는 알림 종류: " + type);
        }
        return creator.get();
    }
}
`,
        },
        {
          id: 'l4', short: `싱글턴`,
          title: `싱글턴을 직접 만든다면 안전한 방법으로`,
          why: `"null이면 만든다"는 방식은 두 스레드가 동시에 들어오면 객체가 두 개 생깁니다. 클래스 로딩을 이용하면 락 없이도 한 번만 만들어집니다.`,
          bad: String.raw`
class Config {
    private static Config instance;

    static Config getInstance() {
        if (instance == null) {       // 두 스레드가 동시에 통과하면 두 개 생성
            instance = new Config();
        }
        return instance;
    }
}
`,
          good: String.raw`
class Config {
    private Config() {}

    private static class Holder {
        static final Config INSTANCE = new Config();   // 처음 쓸 때 한 번, 스레드에 안전
    }
    static Config getInstance() { return Holder.INSTANCE; }
}

// 더 간단하게
enum AppConfig { INSTANCE }
`,
          note: `싱글턴은 테스트에서 바꿔 끼우기 어렵습니다. 스프링 같은 <strong>DI 컨테이너</strong>를 쓰면 직접 만들 일이 거의 없습니다.`,
        },
        {
          id: 'l5', short: `옵저버`,
          title: `후속 작업은 리스너로 떼어 내기`,
          why: `주문 완료 뒤에 할 일이 늘 때마다 주문 서비스를 고치게 됩니다. 듣는 쪽이 스스로 등록하게 하면 주문 서비스는 누가 듣는지 몰라도 됩니다.`,
          bad: String.raw`
void complete(Order order) {
    order.markPaid();
    mailService.sendReceipt(order);   // 후속 작업을 전부 알고 있어야 함
    pointService.addPoint(order);
    statsService.record(order);       // 하나 추가할 때마다 이 메서드를 수정
}
`,
          good: String.raw`
interface OrderListener {
    void onPaid(Order order);
}

private final List<OrderListener> listeners;   // 메일, 포인트, 통계가 각자 등록

void complete(Order order) {
    order.markPaid();
    listeners.forEach(listener -> listener.onPaid(order));
}
`,
        },
        {
          id: 'l6', short: `데코레이터`,
          title: `기능 조합은 상속 말고 감싸기`,
          why: `캐시, 로그, 재시도 같은 부가 기능을 상속으로 붙이면 조합마다 클래스가 필요합니다. 같은 인터페이스로 감싸면 필요한 것만 골라 겹칠 수 있습니다.`,
          bad: String.raw`
class ProductService { ... }
class CachedProductService extends ProductService { ... }
class LoggedProductService extends ProductService { ... }
class LoggedCachedProductService extends CachedProductService { ... }   // 조합마다 클래스
`,
          good: String.raw`
interface ProductFinder {
    Product find(long id);
}

class CachedFinder implements ProductFinder {
    private final ProductFinder next;
    private final Map<Long, Product> cache = new ConcurrentHashMap<>();

    CachedFinder(ProductFinder next) { this.next = next; }

    public Product find(long id) {
        return cache.computeIfAbsent(id, next::find);
    }
}

ProductFinder finder = new LoggedFinder(new CachedFinder(new DbFinder()));
`,
        },
        {
          id: 'l7', short: `어댑터`,
          title: `외부 라이브러리는 어댑터 뒤에 두기`,
          why: `외부 SDK의 타입이 코드 전체에 퍼지면 업체를 바꾸거나 버전을 올릴 때 전부 고쳐야 합니다. 내가 원하는 모양의 인터페이스를 두고 SDK는 한 클래스에서만 만납니다.`,
          bad: String.raw`
// 외부 결제사 SDK 타입이 서비스 코드 전체에 퍼져 있음
TossPaymentResponse res = tossClient.requestPayment(new TossPaymentRequest(amount));
if (res.getResultCode().equals("0000")) { ... }
`,
          good: String.raw`
interface PaymentGateway {                       // 내 코드가 원하는 모양
    PayResult pay(long amount);
}

class TossAdapter implements PaymentGateway {    // 외부 SDK는 여기서만 만난다
    public PayResult pay(long amount) {
        TossPaymentResponse res = tossClient.requestPayment(new TossPaymentRequest(amount));
        return new PayResult("0000".equals(res.getResultCode()));
    }
}
`,
        },
        {
          id: 'l8', short: `널 객체`,
          title: `null 검사 반복 대신 아무것도 안 하는 구현`,
          why: `선택 사항인 협력 객체를 쓸 때마다 null인지 검사하면 코드가 지저분해집니다. 아무 일도 하지 않는 기본 구현을 넣어 두면 검사는 한 번이면 됩니다.`,
          bad: String.raw`
if (listener != null) listener.onStart();
doWork();
if (listener != null) listener.onProgress(50);
doMore();
if (listener != null) listener.onFinish();
`,
          good: String.raw`
interface ProgressListener {
    void onStart();
    void onProgress(int percent);
    void onFinish();

    ProgressListener NONE = new ProgressListener() {   // 아무것도 안 하는 구현
        public void onStart() {}
        public void onProgress(int percent) {}
        public void onFinish() {}
    };
}

this.listener = (listener != null) ? listener : ProgressListener.NONE;   // 검사는 한 번
`,
        },
        {
          id: 'l9', short: `파사드`,
          title: `여러 단계는 하나의 입구로`,
          why: `호출하는 쪽이 여러 서비스의 순서와 세부 절차를 다 알아야 하면, 절차가 바뀔 때 호출하는 곳을 전부 고쳐야 합니다. 절차를 한 메서드에 모읍니다.`,
          bad: String.raw`
// 컨트롤러가 순서와 세부 절차를 전부 알고 있음
stockService.reserve(items);
Payment payment = paymentService.pay(user, total);
Order order = orderService.create(user, items, payment);
deliveryService.request(order);
`,
          good: String.raw`
class OrderFacade {
    Order placeOrder(User user, List<Item> items) {
        stockService.reserve(items);
        Payment payment = paymentService.pay(user, total(items));
        Order order = orderService.create(user, items, payment);
        deliveryService.request(order);
        return order;
    }
}

Order order = orderFacade.placeOrder(user, items);   // 호출하는 쪽은 한 줄
`,
        },
        {
          id: 'l10', short: `과한 설계`,
          title: `필요해지기 전에는 패턴을 쓰지 않기`,
          why: `구현이 하나뿐인데 인터페이스, 추상 클래스, 팩토리를 미리 만들면 읽을 파일만 늘어납니다. 두 번째 구현이 실제로 생길 때 뽑아내도 늦지 않습니다.`,
          bad: String.raw`
interface UserValidator { ... }
abstract class AbstractUserValidator implements UserValidator { ... }
class DefaultUserValidator extends AbstractUserValidator { ... }
class UserValidatorFactory { ... }
// 구현은 하나뿐인데 파일이 네 개
`,
          good: String.raw`
class UserValidator {
    void validate(User user) { ... }
}
// 두 번째 구현이 실제로 필요해질 때 인터페이스를 뽑는다
`,
        },
      ],
    },
    {
      id: 'java-18', no: 18, name: `리팩터링`,
      lead: `동작은 그대로 두고 코드의 모양만 고치는 기술입니다. 이미 돌아가는 코드를 읽기 좋게 바꾸는, 가장 자주 쓰는 손질법들입니다.`,
      lessons: [
        {
          id: 'l1', short: `중복 추출`,
          title: `복사한 코드는 메서드로 뽑기`,
          why: `같은 계산이 두 곳에 있으면 규칙이 바뀔 때 한 곳만 고치고 다른 곳을 잊습니다. 한 번만 쓰고 이름을 붙입니다.`,
          bad: String.raw`
// 주문 화면
long total = price * quantity;
if (total >= 50_000) total -= total / 10;

// 장바구니 화면 : 같은 계산을 복사
long sum = price * quantity;
if (sum >= 50_000) sum -= sum / 10;
`,
          good: String.raw`
long totalPrice(long price, int quantity) {
    long total = price * quantity;
    return total >= BULK_THRESHOLD ? total - total / 10 : total;
}
// 규칙이 바뀌면 한 곳만 고친다
`,
        },
        {
          id: 'l2', short: `설명 변수`,
          title: `긴 조건식은 이름 있는 변수로 나누기`,
          why: `여러 줄에 걸친 조건식은 각 부분이 무슨 뜻인지 해석해야 합니다. 부분마다 이름을 붙이면 조건문이 문장처럼 읽힙니다.`,
          bad: String.raw`
if (user.getAge() >= 19 && user.getJoinedAt().isBefore(LocalDate.now().minusYears(1))
        && order.getTotal() >= 100_000 && !user.isBlocked()) {
    applyVipDiscount(order);
}
`,
          good: String.raw`
boolean isAdult = user.getAge() >= 19;
boolean isLongTimeMember = user.getJoinedAt().isBefore(LocalDate.now().minusYears(1));
boolean isBigOrder = order.getTotal() >= 100_000;

if (isAdult && isLongTimeMember && isBigOrder && !user.isBlocked()) {
    applyVipDiscount(order);
}
`,
        },
        {
          id: 'l3', short: `Map 조회`,
          title: `값을 고르는 if 사다리는 Map으로`,
          why: `키에 따라 값만 달라지는 분기는 로직이 아니라 데이터입니다. 표로 옮기면 항목을 추가할 때 조건문을 건드리지 않습니다.`,
          bad: String.raw`
String label;
if (code.equals("KR")) label = "한국";
else if (code.equals("US")) label = "미국";
else if (code.equals("JP")) label = "일본";
else label = "기타";
`,
          good: String.raw`
private static final Map<String, String> COUNTRY_LABELS = Map.of(
        "KR", "한국",
        "US", "미국",
        "JP", "일본");

String label = COUNTRY_LABELS.getOrDefault(code, "기타");
`,
        },
        {
          id: 'l4', short: `플래그 제거`,
          title: `플래그 변수 대신 바로 반환`,
          why: `found 같은 플래그를 세우고 나중에 확인하는 코드는 흐름을 따라가기 어렵습니다. 찾는 즉시 결과를 돌려주면 플래그가 필요 없습니다.`,
          bad: String.raw`
boolean found = false;
for (User user : users) {
    if (!found) {
        if (user.getEmail().equals(email)) {
            found = true;
        }
    }
}
if (found) { ... }
`,
          good: String.raw`
boolean found = users.stream().anyMatch(u -> u.getEmail().equals(email));

// 또는 메서드로 빼서 찾는 즉시 return
private boolean exists(List<User> users, String email) {
    for (User user : users) {
        if (user.getEmail().equals(email)) return true;
    }
    return false;
}
`,
        },
        {
          id: 'l5', short: `값 객체`,
          title: `뜻이 있는 문자열은 전용 타입으로`,
          why: `이메일도 전화번호도 String이면 서로 바꿔 넣어도 컴파일되고, 형식 검사가 메서드마다 반복됩니다. 전용 타입은 만들어질 때 한 번만 검사합니다.`,
          bad: String.raw`
void register(String email, String phone) {
    if (!email.contains("@")) throw new IllegalArgumentException("이메일 형식");
    ...
}

register(phone, email);   // 순서를 바꿔 넣어도 컴파일됨
`,
          good: String.raw`
record Email(String value) {
    Email {
        if (value == null || !value.contains("@")) {
            throw new IllegalArgumentException("이메일 형식: " + value);
        }
    }
}

void register(Email email, Phone phone) { ... }   // 만들어진 Email은 항상 올바르다
`,
        },
        {
          id: 'l6', short: `변수 재사용`,
          title: `변수 하나를 여러 뜻으로 쓰지 않기`,
          why: `temp 하나에 넓이를 넣었다가 둘레를 넣으면, 읽는 사람은 지금 무엇이 들어 있는지 줄마다 추적해야 합니다. 뜻마다 변수를 따로 둡니다.`,
          bad: String.raw`
double temp = width * height;
System.out.println("넓이: " + temp);

temp = 2 * (width + height);   // 같은 변수를 다른 뜻으로 재사용
System.out.println("둘레: " + temp);
`,
          good: String.raw`
final double area = width * height;
System.out.println("넓이: " + area);

final double perimeter = 2 * (width + height);
System.out.println("둘레: " + perimeter);
`,
        },
        {
          id: 'l7', short: `죽은 코드`,
          title: `안 쓰는 코드는 주석으로 남기지 말고 지우기`,
          why: `주석 처리된 코드는 "혹시 필요한가?" 하는 의심만 남기고 아무도 지우지 못하게 됩니다. 지운 코드는 깃 기록에 그대로 있습니다.`,
          bad: String.raw`
public void process(Order order) {
    // validateOld(order);
    // if (order.isLegacy()) {
    //     convert(order);
    // }
    validate(order);
    save(order);
}

private void unusedHelper() { ... }   // 아무도 부르지 않음
`,
          good: String.raw`
public void process(Order order) {
    validate(order);
    save(order);
}
`,
        },
        {
          id: 'l8', short: `큰 클래스`,
          title: `무엇이든 하는 클래스는 쪼개기`,
          why: `한 클래스가 가입, 로그인, 메일, 엑셀, 통계를 다 하면 무엇을 고치든 그 파일을 건드리게 됩니다. 바뀌는 이유가 같은 것끼리 묶습니다.`,
          bad: String.raw`
class UserService {
    void register(User user) { ... }
    void login(String id, String password) { ... }
    void sendWelcomeMail(User user) { ... }
    void exportExcel(List<User> users) { ... }
    void calculateStatistics() { ... }
    // 2000줄
}
`,
          good: String.raw`
class UserRegistration { void register(User user) { ... } }
class Authentication   { void login(String id, String password) { ... } }
class UserMailer       { void sendWelcomeMail(User user) { ... } }
class UserReport       { void exportExcel(List<User> users) { ... } }
`,
          note: `기준은 줄 수가 아닙니다. <strong>"이 클래스가 바뀌는 이유"를 한 가지로 말할 수 있는지</strong>를 봅니다.`,
        },
        {
          id: 'l9', short: `부정 조건`,
          title: `조건은 긍정형으로`,
          why: `이중 부정은 머릿속에서 두 번 뒤집어야 읽힙니다. 이름과 조건을 긍정형으로 두고, if와 else가 있으면 긍정인 쪽을 먼저 씁니다.`,
          bad: String.raw`
if (!user.isNotActive()) { ... }   // 이중 부정

if (!isValid) {
    showError();
} else {
    proceed();
}
`,
          good: String.raw`
if (user.isActive()) { ... }

if (isValid) {
    proceed();
} else {
    showError();
}
`,
        },
        {
          id: 'l10', short: `테스트 먼저`,
          title: `리팩터링은 테스트를 깔고, 동작 변경과 섞지 않기`,
          why: `구조 변경과 동작 변경을 한 번에 하면 깨졌을 때 어느 쪽 때문인지 알 수 없습니다. 지금 동작을 테스트로 고정한 뒤 구조만 바꿉니다.`,
          bad: String.raw`
// 한 번에 : 메서드 이름 변경 + 클래스 분리 + 할인 규칙 수정
// 테스트 없음. 깨지면 어느 변경 때문인지 알 수 없음
`,
          good: String.raw`
// 1. 지금 동작을 테스트로 고정한다
@Test
void 오만원_이상이면_10퍼센트_할인() {
    assertEquals(54_000, calculator.total(60_000));
}

// 2. 구조만 바꾼다. 테스트가 계속 통과해야 한다
// 3. 동작을 바꾸는 변경은 그다음에 따로 한다
`,
        },
      ],
    },
    {
      id: 'java-19', no: 19, name: `보안 코딩`,
      lead: `기능은 잘 돌아가는데 뚫려 있는 코드들입니다. 16회차 01번의 SQL 인젝션과 함께, 서비스를 만든다면 반드시 알아야 하는 최소한입니다.`,
      lessons: [
        {
          id: 'l1', short: `비밀번호`,
          title: `비밀번호는 전용 해시로 저장`,
          ver: `Spring Security`,
          why: `평문은 말할 것도 없고, MD5나 SHA 같은 빠른 해시는 유출되면 금방 풀립니다. 비밀번호에는 일부러 느리게 만든 전용 알고리즘을 씁니다.`,
          bad: String.raw`
user.setPassword(password);                   // 평문 저장

String hash = DigestUtils.md5Hex(password);   // MD5 : 금방 풀림
`,
          good: String.raw`
PasswordEncoder encoder = new BCryptPasswordEncoder();

String hash = encoder.encode(password);   // 매번 다른 솔트, 일부러 느린 해시
user.setPasswordHash(hash);

boolean ok = encoder.matches(input, user.getPasswordHash());
`,
        },
        {
          id: 'l2', short: `SecureRandom`,
          title: `토큰과 인증번호는 SecureRandom`,
          why: `Random은 값 몇 개만 보면 다음 값을 계산할 수 있습니다. 남이 추측하면 안 되는 값은 암호학적으로 안전한 난수로 만듭니다.`,
          bad: String.raw`
Random random = new Random();
String token = Long.toHexString(random.nextLong());   // 다음 값을 예측할 수 있음
`,
          good: String.raw`
SecureRandom random = new SecureRandom();
byte[] bytes = new byte[32];
random.nextBytes(bytes);
String token = HexFormat.of().formatHex(bytes);

// 간단히 쓸 때 : UUID.randomUUID() 도 SecureRandom 기반
`,
        },
        {
          id: 'l3', short: `경로 조작`,
          title: `파일 이름을 받을 때는 폴더를 벗어나는지 검사`,
          why: `파일 이름에 ../ 를 넣으면 업로드 폴더 밖의 파일에 닿습니다. 경로를 정리한 뒤 기준 폴더 안에 있는지 확인합니다.`,
          bad: String.raw`
// filename = "../../etc/passwd" 가 오면 폴더 밖의 파일을 읽음
Path file = Path.of("/app/uploads", filename);
return Files.readAllBytes(file);
`,
          good: String.raw`
Path base = Path.of("/app/uploads").toAbsolutePath().normalize();
Path file = base.resolve(filename).normalize();

if (!file.startsWith(base)) {
    throw new SecurityException("허용되지 않은 경로: " + filename);
}
return Files.readAllBytes(file);
`,
        },
        {
          id: 'l4', short: `로그`,
          title: `로그에 비밀 정보를 남기지 않기`,
          why: `로그 파일은 여러 사람이 보고, 여러 시스템으로 복사되고, 오래 보관됩니다. 비밀번호와 카드번호가 한 번 찍히면 회수할 수 없습니다.`,
          bad: String.raw`
log.info("로그인 시도 id={} password={}", id, password);

log.debug("결제 요청 {}", cardRequest);   // toString에 카드번호 전체가 들어 있음
`,
          good: String.raw`
log.info("로그인 시도 id={}", id);

log.debug("결제 요청 card={}", mask(cardNumber));   // ****-****-****-1234

static String mask(String card) {
    return "****-****-****-" + card.substring(card.length() - 4);
}
`,
        },
        {
          id: 'l5', short: `역직렬화`,
          title: `외부 데이터를 자바 직렬화로 읽지 않기`,
          ver: `Jackson`,
          why: `자바 직렬화는 바이트에 적힌 대로 아무 클래스나 만들어 냅니다. 조작된 데이터를 읽으면 공격자의 코드가 실행될 수 있습니다.`,
          bad: String.raw`
// 외부에서 받은 바이트를 그대로 객체로 만듦
ObjectInputStream in = new ObjectInputStream(request.getInputStream());
Order order = (Order) in.readObject();
`,
          good: String.raw`
// 데이터만 담는 형식(JSON)으로 받고, 만들 타입은 내가 정한다
ObjectMapper mapper = new ObjectMapper();
OrderRequest req = mapper.readValue(request.getInputStream(), OrderRequest.class);
`,
        },
        {
          id: 'l6', short: `XSS`,
          title: `화면에 내보낼 때 이스케이프`,
          why: `사용자가 입력한 글을 HTML에 그대로 넣으면 그 안의 스크립트가 다른 사용자의 브라우저에서 실행됩니다. 내보내는 순간에 특수 문자를 바꿉니다.`,
          bad: String.raw`
// 이름에 <script>...</script> 가 들어 있으면 그대로 실행됨
String html = "<p>안녕하세요, " + user.getName() + "님</p>";
`,
          good: String.raw`
String html = "<p>안녕하세요, " + HtmlUtils.htmlEscape(user.getName()) + "님</p>";

// 더 좋은 방법 : 자동으로 이스케이프하는 템플릿 엔진에 맡긴다
`,
          note: `Thymeleaf의 <strong>th:text</strong>, React의 중괄호 출력은 기본으로 이스케이프합니다. 직접 문자열로 HTML을 조립할 때가 위험합니다.`,
        },
        {
          id: 'l7', short: `오류 응답`,
          title: `내부 오류를 사용자에게 그대로 보여 주지 않기`,
          why: `예외 메시지에는 테이블 이름, 쿼리, 파일 경로가 들어 있습니다. 공격자에게는 지도와 같습니다. 자세한 내용은 로그에, 사용자에게는 추적 번호만 줍니다.`,
          bad: String.raw`
try {
    return Response.ok(find(id));
} catch (SQLException e) {
    return Response.error(e.getMessage());   // 테이블 이름과 쿼리가 그대로 노출
}
`,
          good: String.raw`
try {
    return Response.ok(find(id));
} catch (SQLException e) {
    String traceId = UUID.randomUUID().toString();
    log.error("주문 조회 실패 traceId={}", traceId, e);   // 자세한 내용은 내부 로그에만
    return Response.error("일시적인 오류입니다. 문의 번호: " + traceId);
}
`,
        },
        {
          id: 'l8', short: `토큰 비교`,
          title: `비밀 값 비교는 끝까지 비교하는 메서드로`,
          why: `equals는 다른 글자를 만나는 즉시 멈춥니다. 응답 시간의 미세한 차이로 앞에서부터 한 글자씩 맞혀 나갈 수 있습니다.`,
          bad: String.raw`
if (inputToken.equals(savedToken)) { ... }   // 다른 글자에서 바로 멈춤
`,
          good: String.raw`
boolean same = MessageDigest.isEqual(
        inputToken.getBytes(StandardCharsets.UTF_8),
        savedToken.getBytes(StandardCharsets.UTF_8));   // 걸리는 시간이 내용에 좌우되지 않음
`,
        },
        {
          id: 'l9', short: `크기 제한`,
          title: `받는 값의 크기에 상한 두기`,
          why: `페이지 크기나 업로드 크기를 요청이 정하는 대로 두면, 큰 숫자 하나로 서버 메모리를 바닥낼 수 있습니다. 서버가 상한을 정합니다.`,
          bad: String.raw`
List<Post> list(int size) {
    return repository.findAll(size);   // size=100000000 으로 호출하면 메모리가 바닥남
}

byte[] data = request.getInputStream().readAllBytes();   // 크기 제한 없음
`,
          good: String.raw`
private static final int MAX_PAGE_SIZE = 100;
private static final long MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

List<Post> list(int size) {
    return repository.findAll(Math.min(Math.max(size, 1), MAX_PAGE_SIZE));
}

if (request.getContentLengthLong() > MAX_UPLOAD_BYTES) {
    throw new IllegalArgumentException("파일은 10MB 이하");
}
`,
        },
        {
          id: 'l10', short: `권한 검사`,
          title: `"내 것인지"는 서버에서 확인`,
          why: `주소의 번호만 바꿔서 남의 주문을 볼 수 있다면 로그인은 의미가 없습니다. 조회할 때마다 요청한 사람의 것인지 확인합니다.`,
          bad: String.raw`
// GET /orders/1024 : 번호만 바꾸면 남의 주문이 보임
Order getOrder(long orderId) {
    return orderRepository.findById(orderId).orElseThrow();
}
`,
          good: String.raw`
Order getOrder(long orderId, User currentUser) {
    Order order = orderRepository.findById(orderId).orElseThrow();
    if (!order.isOwnedBy(currentUser)) {
        throw new AccessDeniedException("본인 주문만 조회할 수 있습니다");
    }
    return order;
}
`,
          note: `화면에서 버튼을 숨기는 것은 보안이 아닙니다. <strong>검사는 항상 서버에서</strong> 합니다.`,
        },
      ],
    },
    {
      id: 'java-20', no: 20, name: `JVM과 메모리`,
      lead: `자바는 메모리를 알아서 관리하지만, 그래도 메모리가 새고 서버가 멈춥니다. 그 원인이 되는 코드와, 문제가 생겼을 때 들여다보는 방법입니다.`,
      lessons: [
        {
          id: 'l1', short: `캐시 누수`,
          title: `끝없이 커지는 캐시 만들지 않기`,
          why: `static Map에 넣기만 하고 지우지 않으면 가비지 컬렉터가 수거하지 못합니다. 자바에서 가장 흔한 메모리 누수입니다. 캐시에는 크기 제한이 있어야 합니다.`,
          bad: String.raw`
private static final Map<String, Report> CACHE = new HashMap<>();

Report get(String key) {
    return CACHE.computeIfAbsent(key, this::build);   // 지우는 곳이 없음
}
`,
          good: String.raw`
// 1000개를 넘으면 가장 오래 안 쓴 것부터 버린다
private final Map<String, Report> cache = Collections.synchronizedMap(
        new LinkedHashMap<>(16, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<String, Report> eldest) {
                return size() > 1000;
            }
        });
`,
          note: `실무에서는 만료 시간과 통계까지 지원하는 <strong>Caffeine</strong> 같은 캐시 라이브러리를 씁니다.`,
        },
        {
          id: 'l2', short: `등록 해제`,
          title: `등록했으면 해제도 짝으로`,
          why: `리스너로 등록된 객체는 등록받은 쪽이 계속 붙잡고 있어서 수거되지 않습니다. 등록과 해제를 한 쌍으로 만듭니다.`,
          bad: String.raw`
class ChatView {
    ChatView(EventBus bus) {
        bus.register(this);   // 화면을 닫아도 bus가 계속 붙잡고 있음
    }
}
`,
          good: String.raw`
class ChatView implements AutoCloseable {
    private final EventBus bus;

    ChatView(EventBus bus) {
        this.bus = bus;
        bus.register(this);
    }

    @Override
    public void close() {
        bus.unregister(this);
    }
}
`,
        },
        {
          id: 'l3', short: `나눠 읽기`,
          title: `대량 데이터는 나눠서 처리`,
          why: `전체를 한 번에 메모리에 올리면 데이터가 늘어난 어느 날 갑자기 서버가 죽습니다. 일정한 크기로 끊어서 처리하면 데이터가 늘어도 메모리 사용량은 같습니다.`,
          bad: String.raw`
List<Order> all = orderRepository.findAll();   // 500만 건을 전부 메모리에
for (Order order : all) {
    writer.write(toCsv(order));
}
`,
          good: String.raw`
long lastId = 0;
while (true) {
    List<Order> page = orderRepository.findNext(lastId, 1000);   // 1000건씩
    if (page.isEmpty()) break;

    for (Order order : page) {
        writer.write(toCsv(order));
    }
    lastId = page.get(page.size() - 1).getId();
}
`,
        },
        {
          id: 'l4', short: `finalize`,
          title: `finalize에 정리를 맡기지 않기`,
          why: `finalize는 언제 불릴지, 불리기는 할지 보장이 없습니다. 자원 정리는 close에 두고 try-with-resources로 확실하게 부릅니다.`,
          bad: String.raw`
class NativeBuffer {
    @Override
    protected void finalize() {   // 언제 불릴지 알 수 없음
        release();
    }
}
`,
          good: String.raw`
class NativeBuffer implements AutoCloseable {
    @Override
    public void close() {
        release();
    }
}

try (NativeBuffer buffer = new NativeBuffer()) {
    ...
}   // 블록을 나가는 즉시 해제
`,
        },
        {
          id: 'l5', short: `System.gc`,
          title: `System.gc()를 부르지 않기`,
          why: `직접 부르면 전체 GC가 돌면서 애플리케이션이 멈춥니다. JVM은 언제 수거할지 훨씬 잘 압니다. 변수에 null을 넣어 줄 필요도 없습니다.`,
          bad: String.raw`
list.clear();
list = null;
System.gc();   // 전체 GC로 애플리케이션이 멈춤
`,
          good: String.raw`
void handle() {
    List<Row> rows = load();
    process(rows);
}   // 메서드가 끝나면 rows는 알아서 수거 대상이 된다
`,
        },
        {
          id: 'l6', short: `힙 옵션`,
          title: `힙 크기와 덤프 옵션을 지정해서 실행`,
          why: `옵션 없이 실행하면 메모리 부족으로 죽었을 때 아무 단서가 없습니다. 죽는 순간의 메모리 상태를 파일로 남기게 해 둡니다.`,
          bad: String.raw`
java -jar app.jar
// 메모리 부족으로 죽으면 원인을 알 방법이 없음
`,
          good: String.raw`
java -Xms1g -Xmx1g -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=logs -jar app.jar

// -Xms, -Xmx        시작 힙과 최대 힙. 같게 두면 크기 조정으로 인한 멈춤이 없다
// HeapDumpOnOOM     죽는 순간의 메모리를 파일로 남긴다. Eclipse MAT로 열어 본다
`,
        },
        {
          id: 'l7', short: `재귀`,
          title: `깊어질 수 있는 재귀는 반복문으로`,
          why: `자바는 재귀 호출마다 스택을 씁니다. 데이터 크기만큼 깊어지는 재귀는 데이터가 커지면 StackOverflowError로 죽습니다.`,
          bad: String.raw`
long sum(Node node) {
    if (node == null) return 0;
    return node.value + sum(node.next);   // 노드가 10만 개면 StackOverflowError
}
`,
          good: String.raw`
long sum(Node node) {
    long total = 0;
    for (Node n = node; n != null; n = n.next) {
        total += n.value;
    }
    return total;
}
`,
        },
        {
          id: 'l8', short: `스레드 덤프`,
          title: `멈췄을 때는 재시작 전에 덤프부터`,
          why: `재시작하면 증거가 사라집니다. 스레드 덤프를 먼저 떠 두면 어느 줄에서 무엇을 기다리다 멈췄는지 보입니다.`,
          bad: String.raw`
// 서버가 멈췄다 → 일단 재시작 → 원인 모름 → 다음 주에 또 멈춤
`,
          good: String.raw`
jcmd                                  // 실행 중인 자바 프로세스 목록
jcmd 12345 Thread.print > dump.txt    // 재시작하기 전에 스레드 덤프
jcmd 12345 GC.heap_info               // 힙 사용량

// 덤프에서 BLOCKED, "waiting to lock" 을 찾으면 어디서 막혔는지 보인다
`,
        },
        {
          id: 'l9', short: `기본형 배열`,
          title: `숫자가 아주 많으면 기본형 배열`,
          why: `List&lt;Integer&gt;는 숫자 하나마다 객체를 하나씩 만듭니다. 수백만 개가 되면 int 배열보다 몇 배의 메모리를 씁니다.`,
          bad: String.raw`
List<Integer> scores = new ArrayList<>();
for (int i = 0; i < 10_000_000; i++) {
    scores.add(i);   // Integer 객체 1000만 개
}
`,
          good: String.raw`
int[] scores = new int[10_000_000];   // 40MB로 끝
for (int i = 0; i < scores.length; i++) {
    scores[i] = i;
}

long total = IntStream.of(scores).asLongStream().sum();
`,
          note: `보통 크기의 컬렉션은 List&lt;Integer&gt;로 충분합니다. <strong>수백만 개 이상</strong>을 다룰 때만 신경 씁니다.`,
        },
        {
          id: 'l10', short: `측정 먼저`,
          title: `추측으로 최적화하지 않기`,
          why: `"이게 더 빠르다더라"로 바꾼 코드는 읽기만 어려워지고 대개 차이가 없습니다. 느린 곳은 재 보면 예상과 다른 곳에 있습니다.`,
          bad: String.raw`
int half = n >> 1;   // n / 2 를 비트 연산으로 "최적화"

for (int i = 0, len = list.size(); i < len; i++) { ... }   // size() 호출을 아끼려고
`,
          good: String.raw`
int half = n / 2;    // 이런 것은 JIT 컴파일러가 알아서 한다

for (Item item : list) { ... }

// 느리다면 추측하지 말고 측정한다
// 1. 프로파일러(JFR, VisualVM)로 실제 병목을 찾는다
// 2. 그 한 곳만 고친다
// 3. 다시 측정해 확인한다
`,
        },
      ],
    },
    {
      id: 'java-21', no: 21, name: `스프링 핵심 원리`,
      lead: `여기부터는 자바로 서비스를 만들 때 가장 많이 쓰는 스프링입니다. 의존성 주입과 트랜잭션에서 초보가 반드시 한 번씩 밟는 지점들을 모았습니다.`,
      lessons: [
        {
          id: 'l1', short: `생성자 주입`,
          title: `필드 주입 대신 생성자 주입`,
          ver: `Spring`,
          why: `필드에 @Autowired를 붙이면 final을 쓸 수 없고, 테스트에서 가짜 객체를 넣어 줄 방법이 없습니다. 생성자로 받으면 스프링 없이도 객체를 만들 수 있습니다.`,
          bad: String.raw`
@Service
public class OrderService {
    @Autowired
    private OrderRepository orderRepository;   // final 불가, 테스트에서 못 바꿈

    @Autowired
    private PaymentGateway paymentGateway;
}
`,
          good: String.raw`
@Service
public class OrderService {
    private final OrderRepository orderRepository;
    private final PaymentGateway paymentGateway;

    public OrderService(OrderRepository orderRepository, PaymentGateway paymentGateway) {
        this.orderRepository = orderRepository;
        this.paymentGateway = paymentGateway;
    }
}
`,
          note: `생성자가 하나면 @Autowired는 생략해도 됩니다. Lombok을 쓴다면 <strong>@RequiredArgsConstructor</strong>가 생성자를 만들어 줍니다.`,
        },
        {
          id: 'l2', short: `빈의 상태`,
          title: `싱글턴 빈에 요청별 상태를 두지 않기`,
          ver: `Spring`,
          why: `스프링 빈은 기본적으로 하나만 만들어져 모든 요청이 함께 씁니다. 필드에 사용자나 합계를 저장하면 다른 사람의 요청이 그 값을 덮어씁니다.`,
          bad: String.raw`
@Service
public class CartService {
    private User currentUser;   // 빈은 하나뿐 : 모든 요청이 이 필드를 공유
    private int total;

    public void add(User user, Item item) {
        this.currentUser = user;          // 다른 사용자의 요청이 덮어씀
        this.total += item.getPrice();
    }
}
`,
          good: String.raw`
@Service
public class CartService {
    private final CartRepository cartRepository;   // 필드에는 의존성만

    public CartService(CartRepository cartRepository) {
        this.cartRepository = cartRepository;
    }

    public int add(User user, Item item) {
        Cart cart = cartRepository.findByUser(user);   // 상태는 지역 변수와 DB에
        cart.add(item);
        return cart.total();
    }
}
`,
        },
        {
          id: 'l3', short: `new 금지`,
          title: `빈을 new로 직접 만들지 않기`,
          ver: `Spring`,
          why: `직접 new 한 객체는 스프링이 관리하지 않습니다. 그 안의 의존성은 채워지지 않고 @Transactional 같은 기능도 동작하지 않습니다.`,
          bad: String.raw`
@RestController
public class OrderController {
    private final OrderService orderService = new OrderService();
    // 스프링이 만든 객체가 아님 : 안쪽 의존성은 null, @Transactional도 무시됨
}
`,
          good: String.raw`
@RestController
public class OrderController {
    private final OrderService orderService;

    public OrderController(OrderService orderService) {   // 스프링이 만든 빈을 받는다
        this.orderService = orderService;
    }
}
`,
        },
        {
          id: 'l4', short: `설정 묶기`,
          title: `설정값은 한 클래스로 묶어 받기`,
          ver: `Spring Boot`,
          why: `@Value를 여기저기 쓰면 같은 키가 여러 클래스에 흩어지고 오타는 실행해 봐야 압니다. 관련 설정을 하나의 타입으로 묶으면 타입 변환과 검증까지 한 곳에서 됩니다.`,
          bad: String.raw`
@Service
public class MailService {
    @Value("\${mail.host}") private String host;
    @Value("\${mail.port}") private int port;
}

@Service
public class AlarmService {
    @Value("\${mail.host}") private String mailHost;   // 같은 키가 또 나옴
}
`,
          good: String.raw`
@ConfigurationProperties(prefix = "mail")
public record MailProperties(String host, int port, Duration timeout) {}

@Service
public class MailService {
    private final MailProperties mail;

    public MailService(MailProperties mail) { this.mail = mail; }
}
`,
          note: `메인 클래스에 <strong>@ConfigurationPropertiesScan</strong>을 붙여야 인식됩니다.`,
        },
        {
          id: 'l5', short: `프로필`,
          title: `환경별 차이는 프로필로`,
          ver: `Spring Boot`,
          lang: { good: 'plain' },
          why: `코드에서 환경 이름으로 분기하면 환경이 늘 때마다 고치고 다시 빌드해야 합니다. 설정 파일을 환경별로 나누고 실행할 때 고릅니다.`,
          bad: String.raw`
if (environment.equals("prod")) {
    url = "jdbc:mysql://prod-db:3306/shop";
} else if (environment.equals("dev")) {
    url = "jdbc:mysql://localhost:3306/shop";
}
// 환경이 늘 때마다 코드를 고치고 다시 빌드
`,
          good: String.raw`
# application-dev.yml
spring.datasource.url: jdbc:mysql://localhost:3306/shop

# application-prod.yml
spring.datasource.url: jdbc:mysql://prod-db:3306/shop
spring.datasource.password: \${DB_PASSWORD}    # 비밀번호는 환경 변수에서

# 실행할 때 고른다
java -jar app.jar --spring.profiles.active=prod
`,
        },
        {
          id: 'l6', short: `내부 호출`,
          title: `@Transactional은 같은 클래스 안의 호출에 걸리지 않는다`,
          ver: `Spring`,
          why: `@Transactional은 밖에서 들어오는 호출을 스프링이 가로채서 동작합니다. 같은 클래스 안에서 부르면 가로챌 틈이 없어 트랜잭션 없이 실행됩니다.`,
          bad: String.raw`
@Service
public class OrderService {
    public void placeAll(List<Order> orders) {
        for (Order order : orders) {
            place(order);   // 같은 클래스 안의 호출
        }
    }

    @Transactional
    public void place(Order order) { ... }   // 트랜잭션이 걸리지 않은 채 실행됨
}
`,
          good: String.raw`
@Service
public class OrderService {
    @Transactional   // 밖에서 들어오는 메서드에 붙인다
    public void placeAll(List<Order> orders) {
        for (Order order : orders) {
            place(order);
        }
    }

    private void place(Order order) { ... }
}
`,
          note: `private 메서드에 붙인 @Transactional도 무시됩니다. 건마다 따로 트랜잭션이 필요하면 <strong>그 메서드를 다른 빈으로 옮깁니다.</strong>`,
        },
        {
          id: 'l7', short: `롤백 규칙`,
          title: `checked 예외는 기본으로 롤백되지 않는다`,
          ver: `Spring`,
          why: `스프링은 RuntimeException과 Error에서만 자동으로 롤백합니다. IOException 같은 checked 예외가 나면 앞에서 저장한 것이 그대로 남습니다.`,
          bad: String.raw`
@Transactional
public void register(Member member) throws IOException {
    memberRepository.save(member);
    fileStorage.saveProfile(member);   // IOException 발생
}
// 롤백되지 않음 : 회원은 저장된 채로 남는다
`,
          good: String.raw`
@Transactional(rollbackFor = Exception.class)
public void register(Member member) throws IOException {
    memberRepository.save(member);
    fileStorage.saveProfile(member);
}

// 또는 unchecked 예외로 바꿔 던진다
`,
        },
        {
          id: 'l8', short: `짧은 트랜잭션`,
          title: `트랜잭션 안에서 외부 호출하지 않기`,
          ver: `Spring`,
          why: `트랜잭션이 열려 있는 동안 DB 커넥션을 쥐고 있습니다. 그 안에서 느린 외부 API를 부르면 커넥션이 금방 바닥나고, 메일 실패가 주문까지 되돌립니다.`,
          bad: String.raw`
@Transactional
public void order(OrderRequest request) {
    Order order = orderRepository.save(request.toOrder());
    paymentClient.pay(order);         // 외부 API 3초 : 그동안 DB 커넥션을 쥐고 있음
    mailSender.sendReceipt(order);    // 메일이 실패하면 주문까지 롤백
}
`,
          good: String.raw`
public void order(OrderRequest request) {
    PayResult result = paymentClient.pay(request);     // 외부 호출은 트랜잭션 밖에서
    Order order = orderWriter.save(request, result);   // DB 작업만 짧게 @Transactional
    mailSender.sendReceipt(order);                     // 실패해도 주문에는 영향 없음
}
`,
        },
        {
          id: 'l9', short: `readOnly`,
          title: `조회에는 읽기 전용 트랜잭션`,
          ver: `Spring`,
          why: `읽기 전용으로 표시하면 JPA가 변경 추적을 생략해 가벼워지고, 읽는 사람도 이 메서드가 데이터를 바꾸지 않는다는 것을 압니다.`,
          bad: String.raw`
@Service
public class ProductService {
    public List<Product> search(String keyword) { ... }   // 트랜잭션 표시가 없음

    @Transactional
    public Product detail(long id) { ... }                // 조회인데 쓰기 트랜잭션
}
`,
          good: String.raw`
@Service
@Transactional(readOnly = true)   // 기본은 읽기 전용
public class ProductService {
    public List<Product> search(String keyword) { ... }
    public Product detail(long id) { ... }

    @Transactional                // 바꾸는 메서드만 따로 표시
    public void changePrice(long id, long price) { ... }
}
`,
        },
        {
          id: 'l10', short: `순환 의존`,
          title: `빈끼리 서로 의존하지 않기`,
          ver: `Spring`,
          why: `A가 B를, B가 A를 필요로 하면 어느 쪽도 먼저 만들 수 없어 애플리케이션이 시작되지 않습니다. 둘이 함께 쓰는 부분을 따로 떼어 내 의존을 한 방향으로 만듭니다.`,
          bad: String.raw`
@Service
public class OrderService {
    private final MemberService memberService;   // 주문 → 회원
}

@Service
public class MemberService {
    private final OrderService orderService;     // 회원 → 주문 : 시작 실패
}
`,
          good: String.raw`
@Service
public class MemberGradeService {   // 둘이 함께 쓰던 로직을 따로 뺀다
    private final OrderRepository orderRepository;
    private final MemberRepository memberRepository;
}

// OrderService  → MemberGradeService
// MemberService → MemberGradeService   (한 방향)
`,
        },
      ],
    },
    {
      id: 'java-22', no: 22, name: `스프링 MVC와 REST API`,
      lead: `다른 사람이 호출하는 API를 만드는 습관입니다. 주소와 상태 코드를 약속대로 쓰고, 컨트롤러를 얇게 유지하는 것이 중심입니다.`,
      lessons: [
        {
          id: 'l1', short: `URL`,
          title: `주소는 명사로, 동작은 HTTP 메서드로`,
          lang: 'plain',
          why: `주소에 get, create, delete 같은 동사를 넣으면 API마다 이름 짓는 방식이 달라집니다. 무엇을 다루는지는 주소가, 무엇을 하는지는 메서드가 말하게 합니다.`,
          bad: String.raw`
GET  /getUser?id=1
POST /createUser
POST /deleteUser?id=1
POST /user/updateName
`,
          good: String.raw`
GET    /users/1          조회
POST   /users            생성
PUT    /users/1          전체 수정
PATCH  /users/1          일부 수정
DELETE /users/1          삭제
GET    /users/1/orders   하위 자원
`,
        },
        {
          id: 'l2', short: `상태 코드`,
          title: `결과는 HTTP 상태 코드로 알리기`,
          ver: `Spring MVC`,
          why: `실패했는데 200을 돌려주면 호출하는 쪽이 본문을 열어 봐야 성공 여부를 압니다. 상태 코드만으로 판단할 수 있어야 합니다.`,
          bad: String.raw`
@PostMapping("/users")
public Map<String, Object> create(@RequestBody UserRequest request) {
    try {
        userService.create(request);
        return Map.of("success", true);
    } catch (Exception e) {
        return Map.of("success", false, "message", e.getMessage());   // 실패인데 200 OK
    }
}
`,
          good: String.raw`
@PostMapping("/users")
public ResponseEntity<UserResponse> create(@RequestBody @Valid UserRequest request) {
    UserResponse created = userService.create(request);
    return ResponseEntity
            .created(URI.create("/users/" + created.id()))   // 201 Created
            .body(created);
}
// 없으면 404, 입력이 틀리면 400, 권한이 없으면 403, 서버 오류는 500
`,
        },
        {
          id: 'l3', short: `응답 DTO`,
          title: `엔티티를 그대로 응답하지 않기`,
          ver: `Spring MVC`,
          why: `엔티티를 그대로 돌려주면 비밀번호 해시 같은 내부 필드까지 나가고, 테이블 컬럼을 바꿀 때마다 API가 같이 바뀝니다. 응답 전용 타입을 둡니다.`,
          bad: String.raw`
@GetMapping("/users/{id}")
public User get(@PathVariable long id) {
    return userRepository.findById(id).orElseThrow();
    // passwordHash까지 나가고, 컬럼을 바꾸면 API도 바뀜
}
`,
          good: String.raw`
public record UserResponse(long id, String name, String email) {
    static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail());
    }
}

@GetMapping("/users/{id}")
public UserResponse get(@PathVariable long id) {
    return UserResponse.from(userService.find(id));
}
`,
        },
        {
          id: 'l4', short: `@Valid`,
          title: `입력 검증은 애너테이션으로 선언`,
          ver: `Bean Validation`,
          why: `컨트롤러마다 if로 검사하면 빠뜨리는 필드가 생기고 오류 응답도 제각각이 됩니다. 요청 타입에 규칙을 선언해 두면 스프링이 검사하고 400으로 응답합니다.`,
          bad: String.raw`
@PostMapping("/users")
public void create(@RequestBody UserRequest request) {
    if (request.name() == null || request.name().isBlank()) throw new IllegalArgumentException("이름");
    if (request.age() < 0) throw new IllegalArgumentException("나이");
    if (!request.email().contains("@")) throw new IllegalArgumentException("이메일");
    ...
}
`,
          good: String.raw`
public record UserRequest(
        @NotBlank String name,
        @Min(0) int age,
        @Email @NotBlank String email) {}

@PostMapping("/users")
public void create(@RequestBody @Valid UserRequest request) {   // 틀리면 자동으로 400
    ...
}
`,
        },
        {
          id: 'l5', short: `예외 처리`,
          title: `예외 응답은 한 곳에서 만들기`,
          ver: `Spring MVC`,
          why: `컨트롤러 메서드마다 같은 try-catch를 쓰면 하나만 달라도 응답이 어긋납니다. 예외를 응답으로 바꾸는 일을 한 클래스에 모읍니다.`,
          bad: String.raw`
@GetMapping("/orders/{id}")
public ResponseEntity<?> get(@PathVariable long id) {
    try {
        return ResponseEntity.ok(orderService.find(id));
    } catch (OrderNotFoundException e) {
        return ResponseEntity.status(404).body(e.getMessage());
    } catch (Exception e) {
        return ResponseEntity.status(500).body("오류");
    }
}   // 모든 메서드에 같은 try-catch
`,
          good: String.raw`
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(OrderNotFoundException.class)
    public ResponseEntity<ErrorResponse> notFound(OrderNotFoundException e) {
        return ResponseEntity.status(404)
                .body(new ErrorResponse("ORDER_NOT_FOUND", e.getMessage()));
    }
}

@GetMapping("/orders/{id}")
public OrderResponse get(@PathVariable long id) {
    return orderService.find(id);   // 컨트롤러는 정상 흐름만
}
`,
        },
        {
          id: 'l6', short: `오류 형식`,
          title: `오류 응답의 모양을 하나로`,
          lang: 'plain',
          why: `오류마다 본문 모양이 다르면 호출하는 쪽이 경우마다 따로 처리해야 합니다. 코드, 메시지, 추적 번호를 담은 한 가지 모양으로 통일합니다.`,
          bad: String.raw`
// 엔드포인트마다 모양이 다름
{ "error": "not found" }
{ "msg": "잘못된 요청", "code": -1 }
"서버 오류"
`,
          good: String.raw`
// 어디서나 같은 모양
{
  "code": "ORDER_NOT_FOUND",
  "message": "주문을 찾을 수 없습니다",
  "traceId": "a1b2c3"
}

public record ErrorResponse(String code, String message, String traceId) {}
`,
          note: `스프링 6부터는 표준 형식인 <strong>ProblemDetail</strong>을 기본으로 지원합니다. 새 프로젝트라면 그것을 써도 됩니다.`,
        },
        {
          id: 'l7', short: `얇은 컨트롤러`,
          title: `컨트롤러에 업무 규칙을 두지 않기`,
          ver: `Spring MVC`,
          why: `규칙이 컨트롤러에 있으면 다른 곳에서 재사용할 수 없고, 테스트하려면 HTTP 요청부터 만들어야 합니다. 컨트롤러는 받고, 넘기고, 응답 모양으로 바꾸는 일만 합니다.`,
          bad: String.raw`
@PostMapping("/orders")
public OrderResponse order(@RequestBody OrderRequest request) {
    Member member = memberRepository.findById(request.memberId()).orElseThrow();
    if (member.getPoint() < request.usePoint()) throw new IllegalStateException("포인트 부족");
    long total = request.items().stream().mapToLong(Item::price).sum() - request.usePoint();
    Order order = orderRepository.save(new Order(member, total));
    member.usePoint(request.usePoint());
    return OrderResponse.from(order);
}
`,
          good: String.raw`
@PostMapping("/orders")
public OrderResponse order(@RequestBody @Valid OrderRequest request) {
    return OrderResponse.from(orderService.place(request));
}
`,
        },
        {
          id: 'l8', short: `페이징`,
          title: `목록 API는 처음부터 페이징`,
          ver: `Spring Data`,
          why: `데이터가 적을 때는 전체를 내려도 되지만, 늘어난 뒤에 페이징을 붙이면 API가 바뀌어 클라이언트가 깨집니다. 목록은 처음부터 나눠서 줍니다.`,
          bad: String.raw`
@GetMapping("/posts")
public List<PostResponse> list() {
    return postService.findAll();   // 글이 100만 개가 되면 전부 내려보냄
}
`,
          good: String.raw`
@GetMapping("/posts")
public Page<PostResponse> list(@PageableDefault(size = 20) Pageable pageable) {
    return postService.find(pageable);
}
// GET /posts?page=0&size=20&sort=createdAt,desc
`,
          note: `19회차 09번처럼 size에는 상한을 둡니다. <strong>spring.data.web.pageable.max-page-size</strong> 설정으로 정합니다.`,
        },
        {
          id: 'l9', short: `타입 변환`,
          title: `요청 값은 원하는 타입으로 바로 받기`,
          ver: `Spring MVC`,
          why: `문자열로 받아 직접 변환하면 형식이 틀렸을 때 500 오류가 납니다. 타입으로 선언하면 스프링이 변환하고 실패하면 400으로 응답합니다.`,
          bad: String.raw`
@GetMapping("/orders")
public List<OrderResponse> search(@RequestParam String from, @RequestParam String status) {
    LocalDate date = LocalDate.parse(from);         // 형식이 틀리면 500
    OrderStatus s = OrderStatus.valueOf(status);    // 없는 값이면 500
    ...
}
`,
          good: String.raw`
@GetMapping("/orders")
public List<OrderResponse> search(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam OrderStatus status) {         // 변환은 스프링이, 실패하면 400
    ...
}
`,
        },
        {
          id: 'l10', short: `하위 호환`,
          title: `이미 쓰이는 응답 필드는 바꾸지 않기`,
          why: `필드 이름을 바꾸거나 지우면 이미 배포된 앱과 다른 팀의 코드가 한꺼번에 깨집니다. 있던 것은 그대로 두고 새 필드를 추가합니다.`,
          bad: String.raw`
// 배포 전
public record UserResponse(long id, String name) {}

// 배포 후 : 이름을 바꿈. 기존 앱은 name을 못 찾아 전부 깨짐
public record UserResponse(long id, String fullName) {}
`,
          good: String.raw`
// 있던 필드는 그대로 두고 새 필드를 추가한다
public record UserResponse(long id, String name, String fullName) {}

// 꼭 깨야 하는 변경은 새 버전 주소로
// GET /v2/users/1
`,
        },
      ],
    },
    {
      id: 'java-23', no: 23, name: `JPA와 영속성`,
      lead: `JPA는 SQL을 대신 써 주지만, 어떤 SQL이 나가는지 모르고 쓰면 느려지고 데이터가 깨집니다. 16회차의 내용이 JPA에서는 어떤 모습으로 나타나는지 봅니다.`,
      lessons: [
        {
          id: 'l1', short: `N+1`,
          title: `연관 객체를 반복문에서 꺼내면 N+1`,
          ver: `Spring Data JPA`,
          why: `목록을 읽은 뒤 반복문에서 연관 객체를 건드리면 그때마다 쿼리가 나갑니다. 함께 쓸 것이 분명하면 한 번에 같이 조회합니다.`,
          bad: String.raw`
List<Order> orders = orderRepository.findAll();   // 쿼리 1번
for (Order order : orders) {
    String name = order.getMember().getName();    // 주문마다 회원 조회 쿼리 : N번
}
`,
          good: String.raw`
public interface OrderRepository extends JpaRepository<Order, Long> {

    @Query("select o from Order o join fetch o.member")
    List<Order> findAllWithMember();              // 한 번에 함께 조회

    @EntityGraph(attributePaths = "member")       // 같은 효과
    List<Order> findByStatus(OrderStatus status);
}
`,
        },
        {
          id: 'l2', short: `LAZY`,
          title: `연관 관계는 지연 로딩으로`,
          ver: `JPA`,
          why: `즉시 로딩은 쓰지 않을 때도 연관 객체를 무조건 조회해서, 예상하지 못한 쿼리가 줄줄이 나갑니다. 지연 로딩으로 두고 필요한 곳에서만 함께 조회합니다.`,
          bad: String.raw`
@Entity
public class Order {
    @ManyToOne                   // 기본값이 EAGER : 주문을 읽을 때마다 회원도 조회
    private Member member;

    @ManyToOne
    private Delivery delivery;   // 쓰지 않아도 항상 따라옴
}
`,
          good: String.raw`
@Entity
public class Order {
    @ManyToOne(fetch = FetchType.LAZY)   // 실제로 쓸 때 조회
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    private Delivery delivery;
}
`,
          note: `@OneToMany와 @ManyToMany는 기본이 지연 로딩입니다. <strong>@ManyToOne과 @OneToOne은 기본이 즉시 로딩</strong>이라 직접 바꿔야 합니다.`,
        },
        {
          id: 'l3', short: `setter`,
          title: `엔티티에 setter를 열어 두지 않기`,
          ver: `JPA`,
          why: `setter가 열려 있으면 어디서든 아무 값으로나 바꿀 수 있고, 함께 바뀌어야 할 값을 빠뜨립니다. 상태를 바꾸는 일은 뜻이 담긴 메서드로만 하게 합니다.`,
          bad: String.raw`
@Entity
@Getter @Setter
public class Order {
    private OrderStatus status;
    private LocalDateTime canceledAt;
}

order.setStatus(OrderStatus.CANCELED);   // canceledAt은 깜빡함
`,
          good: String.raw`
@Entity
@Getter
public class Order {
    private OrderStatus status;
    private LocalDateTime canceledAt;

    public void cancel() {
        if (status == OrderStatus.SHIPPED) {
            throw new IllegalStateException("배송 시작 후에는 취소할 수 없습니다");
        }
        this.status = OrderStatus.CANCELED;
        this.canceledAt = LocalDateTime.now();
    }
}
`,
        },
        {
          id: 'l4', short: `변경 감지`,
          title: `수정은 조회한 엔티티를 바꾸는 것으로`,
          ver: `JPA`,
          why: `요청 값으로 새 객체를 만들어 save하면 채우지 않은 필드가 전부 null로 덮입니다. 조회한 엔티티의 값을 바꾸면 트랜잭션이 끝날 때 바뀐 부분만 반영됩니다.`,
          bad: String.raw`
@Transactional
public void changeName(MemberRequest request) {
    Member member = new Member();     // 요청 값으로 새 객체를 만들어
    member.setId(request.id());
    member.setName(request.name());
    memberRepository.save(member);    // 통째로 덮어씀 : 안 채운 필드는 null이 됨
}
`,
          good: String.raw`
@Transactional
public void changeName(long id, String name) {
    Member member = memberRepository.findById(id).orElseThrow();
    member.changeName(name);
}   // 트랜잭션이 끝날 때 바뀐 것을 찾아 UPDATE를 보낸다. save를 부를 필요가 없다
`,
        },
        {
          id: 'l5', short: `@Data`,
          title: `엔티티에 @Data를 쓰지 않기`,
          ver: `Lombok`,
          why: `@Data가 만드는 toString과 equals는 모든 필드를 씁니다. 양방향 관계에서는 서로를 끝없이 호출하고, 지연 로딩된 컬렉션까지 건드려 쿼리가 나갑니다.`,
          bad: String.raw`
@Entity
@Data   // equals, hashCode, toString이 모든 필드를 사용
public class Member {
    @Id @GeneratedValue
    private Long id;

    @OneToMany(mappedBy = "member")
    private List<Order> orders;   // toString이 서로를 호출 : StackOverflowError
}
`,
          good: String.raw`
@Entity
@Getter
@ToString(exclude = "orders")
public class Member {
    @Id @GeneratedValue
    private Long id;

    @OneToMany(mappedBy = "member")
    private List<Order> orders = new ArrayList<>();

    @Override
    public boolean equals(Object o) {
        return o instanceof Member other && id != null && id.equals(other.id);
    }

    @Override
    public int hashCode() { return getClass().hashCode(); }
}
`,
        },
        {
          id: 'l6', short: `양방향`,
          title: `양방향 관계는 양쪽을 함께 맞추기`,
          ver: `JPA`,
          why: `DB에 저장되는 것은 외래 키를 가진 쪽의 값입니다. 반대쪽 컬렉션에만 넣으면 외래 키가 비어 저장됩니다. 양쪽을 한 번에 맞추는 메서드를 둡니다.`,
          bad: String.raw`
Member member = memberRepository.findById(1L).orElseThrow();
Order order = new Order();

member.getOrders().add(order);   // 반대쪽(order.member)을 안 채움
orderRepository.save(order);     // 외래 키가 null로 저장됨
`,
          good: String.raw`
@Entity
public class Order {
    @ManyToOne(fetch = FetchType.LAZY)
    private Member member;       // 외래 키를 가진 쪽이 관계의 주인

    public void assignTo(Member member) {   // 양쪽을 한 번에 맞춘다
        this.member = member;
        member.getOrders().add(this);
    }
}

order.assignTo(member);
`,
        },
        {
          id: 'l7', short: `벌크 수정`,
          title: `대량 수정은 쿼리 한 번으로`,
          ver: `Spring Data JPA`,
          why: `엔티티를 하나씩 읽어 고치면 건수만큼 UPDATE가 나가고 전부 메모리에 올라옵니다. 조건이 같은 대량 수정은 쿼리 하나로 보냅니다.`,
          bad: String.raw`
List<Member> dormant = memberRepository.findByLastLoginBefore(oneYearAgo);   // 10만 건
for (Member member : dormant) {
    member.markDormant();   // UPDATE 10만 번
}
`,
          good: String.raw`
@Modifying(clearAutomatically = true)
@Query("update Member m set m.status = 'DORMANT' where m.lastLogin < :date")
int markDormantBefore(@Param("date") LocalDateTime date);   // UPDATE 한 번
`,
          note: `벌크 쿼리는 이미 읽어 둔 엔티티를 갱신하지 않습니다. <strong>clearAutomatically</strong>로 읽어 둔 것을 비워야 옛 값을 보지 않습니다.`,
        },
        {
          id: 'l8', short: `DTO 변환`,
          title: `필요한 값은 트랜잭션 안에서 꺼내기`,
          ver: `JPA`,
          why: `지연 로딩은 트랜잭션이 살아 있을 때만 됩니다. 서비스가 엔티티를 그대로 돌려주면 컨트롤러에서 연관 객체를 건드릴 때 예외가 납니다.`,
          bad: String.raw`
@GetMapping("/orders/{id}")
public OrderResponse get(@PathVariable long id) {
    Order order = orderService.find(id);      // 트랜잭션은 여기서 끝남
    return new OrderResponse(order.getId(),
            order.getMember().getName());     // LazyInitializationException
}
`,
          good: String.raw`
@Transactional(readOnly = true)
public OrderResponse find(long id) {
    Order order = orderRepository.findById(id).orElseThrow();
    return new OrderResponse(order.getId(), order.getMember().getName());
}   // 트랜잭션 안에서 필요한 값을 모두 꺼내 DTO로 만든다
`,
          note: `스프링 부트 기본 설정(open-in-view)에서는 왼쪽 코드도 동작합니다. 대신 응답이 끝날 때까지 DB 커넥션을 쥐고 있어서 <strong>실무에서는 이 설정을 끄는 경우가 많습니다.</strong>`,
        },
        {
          id: 'l9', short: `enum 저장`,
          title: `enum은 이름으로 저장`,
          ver: `JPA`,
          why: `기본 설정은 enum의 순서 번호를 저장합니다. 15회차 02번과 같은 문제로, 상수를 중간에 추가하면 기존 데이터의 뜻이 바뀝니다.`,
          bad: String.raw`
@Entity
public class Order {
    @Enumerated   // 기본값 ORDINAL : DB에 0, 1, 2로 저장
    private OrderStatus status;
}
`,
          good: String.raw`
@Entity
public class Order {
    @Enumerated(EnumType.STRING)   // "PAID", "CANCELED" 처럼 이름으로 저장
    private OrderStatus status;
}
`,
        },
        {
          id: 'l10', short: `컬렉션 페이징`,
          title: `컬렉션을 fetch join하면서 페이징하지 않기`,
          ver: `Hibernate`,
          why: `일대다 컬렉션을 fetch join하면 행이 불어나서 DB에서 페이징할 수 없습니다. 하이버네이트는 전부 읽어 온 뒤 메모리에서 자르고, 경고만 남깁니다.`,
          bad: String.raw`
@Query("select m from Member m join fetch m.orders")
Page<Member> findAllWithOrders(Pageable pageable);
// 전부 읽어 와 메모리에서 페이징 : 데이터가 많으면 메모리가 바닥남
`,
          good: String.raw`
// 컬렉션은 fetch join 하지 않고 그대로 페이징한다
Page<Member> findAll(Pageable pageable);

// application.yml : 지연 로딩할 때 100개씩 묶어 IN 쿼리로 가져온다
// spring.jpa.properties.hibernate.default_batch_fetch_size: 100
`,
        },
      ],
    },
    {
      id: 'java-24', no: 24, name: `스프링 테스트`,
      lead: `4회차의 테스트 기본기를 스프링 프로젝트에 적용합니다. 테스트가 느려지면 아무도 돌리지 않게 되므로, 필요한 만큼만 띄우는 것이 핵심입니다.`,
      lessons: [
        {
          id: 'l1', short: `단위 테스트`,
          title: `스프링이 필요 없는 테스트에 스프링을 띄우지 않기`,
          ver: `JUnit 5`,
          why: `@SpringBootTest는 애플리케이션 전체를 띄워서 수십 초가 걸립니다. 계산이나 규칙을 확인하는 테스트는 객체를 직접 만들어 바로 검증합니다.`,
          bad: String.raw`
@SpringBootTest   // 계산 하나 보려고 애플리케이션 전체를 띄움
class DiscountCalculatorTest {
    @Autowired DiscountCalculator calculator;

    @Test
    void vip는_20퍼센트_할인() {
        assertEquals(8_000, calculator.apply(Grade.VIP, 10_000));
    }
}
`,
          good: String.raw`
class DiscountCalculatorTest {
    private final DiscountCalculator calculator = new DiscountCalculator();

    @Test
    void vip는_20퍼센트_할인() {
        assertEquals(8_000, calculator.apply(Grade.VIP, 10_000));
    }
}
`,
          note: `테스트의 대부분은 이런 <strong>스프링 없는 단위 테스트</strong>여야 합니다. 2회차 07번의 생성자 주입이 이것을 가능하게 합니다.`,
        },
        {
          id: 'l2', short: `슬라이스`,
          title: `한 계층만 볼 때는 슬라이스 테스트`,
          ver: `Spring Boot`,
          why: `컨트롤러만 확인하는데 DB와 메시지 큐까지 띄울 필요는 없습니다. 계층별로 필요한 부분만 띄우는 애너테이션이 있습니다.`,
          bad: String.raw`
@SpringBootTest
@AutoConfigureMockMvc
class UserControllerTest { ... }   // 컨트롤러만 보려는데 전부 띄움

@SpringBootTest
class UserRepositoryTest { ... }
`,
          good: String.raw`
@WebMvcTest(UserController.class)   // 웹 계층만
class UserControllerTest { ... }

@DataJpaTest                        // JPA와 테스트용 DB만. 끝나면 자동 롤백
class UserRepositoryTest { ... }
`,
        },
        {
          id: 'l3', short: `MockMvc`,
          title: `컨트롤러는 HTTP 요청으로 테스트`,
          ver: `Spring MVC Test`,
          why: `컨트롤러 메서드를 직접 부르면 주소 매핑, JSON 변환, 상태 코드, 입력 검증은 하나도 확인되지 않습니다. 실제 요청처럼 보내고 응답을 확인합니다.`,
          bad: String.raw`
@Test
void 회원_조회() {
    UserResponse response = userController.get(1L);   // 메서드를 직접 호출
    assertEquals("kim", response.name());
}
`,
          good: String.raw`
@Test
void 회원_조회() throws Exception {
    given(userService.find(1L)).willReturn(new User(1L, "kim"));

    mockMvc.perform(get("/users/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("kim"));
}

@Test
void 없는_회원이면_404() throws Exception {
    given(userService.find(99L)).willThrow(new UserNotFoundException(99L));

    mockMvc.perform(get("/users/99"))
            .andExpect(status().isNotFound());
}
`,
        },
        {
          id: 'l4', short: `컨텍스트 재사용`,
          title: `테스트마다 다른 가짜 빈 조합을 만들지 않기`,
          ver: `Spring Boot`,
          why: `스프링은 설정이 같은 테스트끼리 애플리케이션을 한 번만 띄워 재사용합니다. 테스트 클래스마다 가짜 빈 조합이 다르면 그때마다 새로 띄워 전체가 느려집니다.`,
          bad: String.raw`
@SpringBootTest
class OrderTest {
    @MockBean PaymentGateway gateway;    // 클래스마다 가짜 빈 조합이 다름
}

@SpringBootTest
class MemberTest {
    @MockBean MailSender mailSender;     // 그때마다 애플리케이션을 새로 띄움
}
`,
          good: String.raw`
@TestConfiguration
public class FakeExternalConfig {        // 외부 연동의 가짜 구현을 한 곳에
    @Bean PaymentGateway paymentGateway() { return new FakePaymentGateway(); }
    @Bean MailSender mailSender() { return new FakeMailSender(); }
}

@SpringBootTest
@Import(FakeExternalConfig.class)        // 모든 테스트가 같은 설정을 쓴다
class OrderTest { ... }
`,
          note: `스프링 부트 3.4부터 @MockBean은 <strong>@MockitoBean</strong>으로 이름이 바뀌었습니다. 원리는 같습니다.`,
        },
        {
          id: 'l5', short: `독립성`,
          title: `테스트는 서로에게 기대지 않게`,
          ver: `Spring Test`,
          why: `앞 테스트가 넣은 데이터에 기대면 하나만 따로 돌리거나 순서가 바뀔 때 깨집니다. 필요한 데이터는 각 테스트가 직접 만들고, 끝나면 되돌립니다.`,
          bad: String.raw`
@Test @Order(1)
void 회원을_등록한다() {
    memberService.register("kim");
}

@Test @Order(2)
void 등록한_회원을_조회한다() {
    assertNotNull(memberService.find("kim"));   // 앞 테스트가 먼저 돌아야만 통과
}
`,
          good: String.raw`
@SpringBootTest
@Transactional   // 테스트가 끝나면 롤백
class MemberServiceTest {

    @Test
    void 등록한_회원을_조회한다() {
        memberService.register("kim");          // 필요한 데이터는 테스트 안에서

        assertNotNull(memberService.find("kim"));
    }
}
`,
        },
        {
          id: 'l6', short: `AssertJ`,
          title: `검증문은 AssertJ로 읽기 쉽게`,
          ver: `AssertJ`,
          why: `assertEquals는 기대값과 실제값의 순서를 자주 바꿔 쓰고, assertTrue는 실패해도 무엇이 틀렸는지 알려 주지 않습니다. AssertJ는 문장처럼 읽히고 실패 메시지에 실제 값이 나옵니다.`,
          bad: String.raw`
assertEquals(result.size(), 3);        // 기대값과 실제값 순서가 뒤바뀜
assertTrue(result.contains("kim"));    // 실패하면 "expected true" 뿐
assertTrue(order.getTotal() > 10_000);
`,
          good: String.raw`
assertThat(result).hasSize(3).contains("kim");
assertThat(order.getTotal()).isGreaterThan(10_000);

assertThat(members)
        .extracting(Member::getName)
        .containsExactly("kim", "lee");
`,
        },
        {
          id: 'l7', short: `예외 검증`,
          title: `예외 테스트에 try-catch를 쓰지 않기`,
          ver: `AssertJ`,
          why: `try-catch와 fail을 조합한 테스트는 길고, fail을 빠뜨리면 예외가 안 나도 통과합니다. 예외의 종류와 메시지를 한 문장으로 검증합니다.`,
          bad: String.raw`
@Test
void 잔액이_부족하면_예외() {
    try {
        account.withdraw(10_000);
        fail("예외가 나야 함");
    } catch (InsufficientBalanceException e) {
        // 통과
    }
}
`,
          good: String.raw`
@Test
void 잔액이_부족하면_예외() {
    assertThatThrownBy(() -> account.withdraw(10_000))
            .isInstanceOf(InsufficientBalanceException.class)
            .hasMessageContaining("잔액 부족");
}
`,
        },
        {
          id: 'l8', short: `테스트 데이터`,
          title: `테스트 데이터는 도우미로 만들기`,
          why: `긴 생성자 호출이 테스트마다 반복되면 이 테스트에서 중요한 값이 무엇인지 보이지 않고, 생성자가 바뀔 때 모든 테스트를 고쳐야 합니다.`,
          bad: String.raw`
@Test
void 배송비_계산() {
    Member member = new Member(1L, "kim", "kim@test.com", Grade.VIP, LocalDate.of(2020, 1, 1), true);
    Order order = new Order(1L, member, List.of(new Item("커피", 4500, 2)), OrderStatus.PAID, null);
    // 어떤 값이 이 테스트에 중요한지 보이지 않음
}
`,
          good: String.raw`
@Test
void VIP는_배송비가_무료() {
    Order order = anOrder().by(aMember().grade(Grade.VIP)).build();   // 중요한 값만 드러난다

    assertThat(shipping.feeOf(order)).isZero();
}

// 테스트용 도우미 : 기본값을 채워 두고 필요한 것만 바꾼다
static OrderFixture anOrder() { return new OrderFixture(); }
`,
        },
        {
          id: 'l9', short: `Testcontainers`,
          title: `DB 테스트는 운영과 같은 DB로`,
          ver: `Testcontainers`,
          why: `테스트는 H2로, 운영은 MySQL로 돌리면 DB마다 다른 문법, 타입, 락 동작이 운영에서 처음 실행됩니다. 도커로 같은 DB를 띄워 테스트합니다.`,
          bad: String.raw`
// 테스트는 H2, 운영은 MySQL
// MySQL 전용 문법과 동작은 운영에서 처음 실행된다
@DataJpaTest
class OrderRepositoryTest { ... }
`,
          good: String.raw`
@Testcontainers
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class OrderRepositoryTest {

    @Container
    @ServiceConnection
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.4");

    ...
}
`,
        },
        {
          id: 'l10', short: `결과 검증`,
          title: `호출 순서가 아니라 결과를 검증`,
          ver: `Mockito`,
          why: `내부에서 무엇을 어떤 순서로 불렀는지까지 고정하면, 결과는 같은데 구조만 바꿔도 테스트가 깨집니다. 밖에서 보이는 결과와 외부로 나가는 호출만 확인합니다.`,
          bad: String.raw`
@Test
void 주문() {
    orderService.place(request);

    InOrder inOrder = inOrder(stockService, paymentGateway, orderRepository);
    inOrder.verify(stockService).reserve(any());           // 순서와 횟수를 전부 고정
    inOrder.verify(paymentGateway, times(1)).pay(any());
    inOrder.verify(orderRepository).save(any());
}
`,
          good: String.raw`
@Test
void 주문하면_재고가_줄고_결제된_주문이_생긴다() {
    Order order = orderService.place(request);

    assertThat(order.getStatus()).isEqualTo(OrderStatus.PAID);
    assertThat(stockOf(coffee)).isEqualTo(8);          // 눈에 보이는 결과
    verify(paymentGateway).pay(order.getTotal());      // 외부로 나가는 호출
}
`,
        },
      ],
    },
    {
      id: 'java-25', no: 25, name: `로깅과 모니터링`,
      lead: `2회차 10번에서 로거를 쓰기로 했습니다. 여기서는 무엇을, 어느 레벨로, 어떤 모양으로 남겨야 장애가 났을 때 로그만 보고 원인을 찾을 수 있는지를 다룹니다.`,
      lessons: [
        {
          id: 'l1', short: `레벨`,
          title: `로그 레벨을 뜻에 맞게`,
          ver: `SLF4J`,
          why: `전부 INFO로 남기면 중요한 줄이 묻히고, 흔한 일을 ERROR로 남기면 알람이 울려도 아무도 보지 않게 됩니다. 레벨마다 기준을 정해 둡니다.`,
          bad: String.raw`
log.info("메서드 시작");
log.info("변수 x = {}", x);                   // 디버깅용 출력까지 전부 INFO
log.error("입력값이 비어 있음: {}", input);    // 사용자의 흔한 실수인데 ERROR
log.info("결제 서버 연결 실패", e);            // 진짜 장애인데 INFO
`,
          good: String.raw`
log.debug("할인 계산 grade={} price={}", grade, price);    // 개발할 때만 보는 자세한 흐름
log.info("주문 완료 orderId={}", orderId);                 // 운영에서 남길 업무 사건
log.warn("재시도 {}회째 orderId={}", retry, orderId);      // 문제는 아니지만 지켜봐야 함
log.error("결제 서버 연결 실패 orderId={}", orderId, e);   // 사람이 확인해야 하는 장애
`,
        },
        {
          id: 'l2', short: `식별자`,
          title: `로그에는 누구의 무엇인지 남기기`,
          ver: `SLF4J`,
          why: `"결제 실패" 한 줄로는 어느 주문인지 찾을 수 없습니다. 주문 번호, 사용자 번호처럼 검색할 수 있는 값을 함께 남깁니다.`,
          bad: String.raw`
log.error("결제 실패");
log.info("처리 완료");
`,
          good: String.raw`
log.error("결제 실패 orderId={} userId={} amount={} reason={}",
        orderId, userId, amount, result.reason());

log.info("주문 처리 완료 orderId={} elapsedMs={}", orderId, elapsed);
`,
        },
        {
          id: 'l3', short: `MDC`,
          title: `요청마다 추적 번호 붙이기`,
          ver: `SLF4J`,
          why: `여러 요청이 동시에 처리되면 로그가 뒤섞여 한 요청의 흐름을 따라갈 수 없습니다. 요청이 들어올 때 번호를 하나 정해 두면 그 요청의 모든 로그에 같은 번호가 찍힙니다.`,
          bad: String.raw`
log.info("주문 시작");
log.info("재고 확인");
log.info("결제 요청");
// 동시에 100명이 주문하면 누구의 흐름인지 알 수 없음
`,
          good: String.raw`
public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
        throws IOException, ServletException {
    MDC.put("traceId", UUID.randomUUID().toString().substring(0, 8));
    try {
        chain.doFilter(req, res);
    } finally {
        MDC.clear();   // 스레드가 재사용되므로 반드시 비운다
    }
}
// 로그 패턴에 %X{traceId} 를 넣으면 모든 줄에 같은 번호가 찍힌다
`,
        },
        {
          id: 'l4', short: `키=값`,
          title: `검색할 수 있는 모양으로 남기기`,
          ver: `SLF4J`,
          why: `문장으로 쓴 로그는 사람이 읽기는 좋지만 조건으로 찾을 수 없습니다. 키와 값의 쌍으로 남기면 로그 수집 도구에서 걸러 보고 집계할 수 있습니다.`,
          bad: String.raw`
log.info(userName + "님이 " + itemName + "을 " + count + "개 주문했습니다 (총 " + total + "원)");
// "총액 10만 원 이상인 주문"을 찾을 방법이 없음
`,
          good: String.raw`
log.info("order.created userId={} itemId={} count={} total={}", userId, itemId, count, total);
// 수집 도구에서 total >= 100000 같은 조건으로 찾을 수 있다
`,
        },
        {
          id: 'l5', short: `로그 양`,
          title: `반복문 안에서 INFO 로그를 쏟아내지 않기`,
          ver: `SLF4J`,
          why: `건마다 한 줄씩 남기면 로그가 수십만 줄이 되어 중요한 줄을 찾을 수 없고 디스크와 성능도 잡아먹습니다. 시작과 끝에 요약을 남기고 자세한 것은 DEBUG로 내립니다.`,
          bad: String.raw`
for (Order order : orders) {         // 10만 건
    log.info("처리 중: {}", order);   // 객체 전체를 10만 줄
    process(order);
}
`,
          good: String.raw`
log.info("주문 일괄 처리 시작 count={}", orders.size());

for (Order order : orders) {
    log.debug("처리 orderId={}", order.getId());   // 자세한 것은 DEBUG로, id만
    process(order);
}

log.info("주문 일괄 처리 완료 count={} failed={}", orders.size(), failed);
`,
        },
        {
          id: 'l6', short: `비싼 인자`,
          title: `로그 인자를 만드는 비용도 생각하기`,
          ver: `SLF4J 2.0`,
          why: `DEBUG가 꺼져 있어도 인자로 넘긴 메서드는 먼저 실행됩니다. 객체를 JSON으로 바꾸는 것처럼 비싼 작업은 레벨을 확인한 뒤에 하게 합니다.`,
          bad: String.raw`
log.debug("장바구니 상태: {}", toJson(cart));   // DEBUG가 꺼져 있어도 toJson은 매번 실행
`,
          good: String.raw`
if (log.isDebugEnabled()) {
    log.debug("장바구니 상태: {}", toJson(cart));
}

// SLF4J 2.0 이상 : 실제로 찍을 때만 계산한다
log.atDebug().addArgument(() -> toJson(cart)).log("장바구니 상태: {}");
`,
        },
        {
          id: 'l7', short: `헬스 체크`,
          title: `살아 있는지 확인할 수 있는 주소 두기`,
          ver: `Spring Boot Actuator`,
          lang: 'plain',
          why: `프로세스가 떠 있어도 DB에 못 붙거나 응답을 못 하는 상태일 수 있습니다. 상태를 점검해 알려 주는 주소가 있어야 배포 도구와 감시 도구가 판단할 수 있습니다.`,
          bad: String.raw`
# 서버가 살아 있는지 확인하는 방법
ps -ef | grep java
# 프로세스는 떠 있는데 응답을 못 하는 상태를 구분하지 못함
`,
          good: String.raw`
# build.gradle.kts
implementation("org.springframework.boot:spring-boot-starter-actuator")

# application.yml
management.endpoints.web.exposure.include: health,metrics

# 확인
curl http://localhost:8080/actuator/health
{"status":"UP"}
`,
        },
        {
          id: 'l8', short: `메트릭`,
          title: `건수와 시간은 로그 말고 메트릭으로`,
          ver: `Micrometer`,
          why: `"오늘 주문이 몇 건인가", "결제가 평균 몇 초 걸리나"를 로그 파일에서 세는 것은 느리고 부정확합니다. 숫자는 메트릭으로 기록해 그래프와 알람에 씁니다.`,
          bad: String.raw`
log.info("주문 완료");
// 오늘 주문이 몇 건인지 알려면 로그 파일에서 줄 수를 센다
`,
          good: String.raw`
private final Counter orderCounter;
private final Timer payTimer;

public OrderService(MeterRegistry registry) {
    this.orderCounter = registry.counter("orders.created");
    this.payTimer = registry.timer("payment.duration");
}

public void place(Order order) {
    payTimer.record(() -> paymentGateway.pay(order));   // 걸린 시간의 분포
    orderCounter.increment();                           // 건수
}
`,
        },
        {
          id: 'l9', short: `느린 호출`,
          title: `평소보다 느린 호출은 기록하기`,
          why: `실패한 호출은 예외로 드러나지만, 느려진 호출은 아무 흔적 없이 지나갑니다. 장애는 대개 느려지는 것으로 시작하므로 기준을 넘으면 경고를 남깁니다.`,
          bad: String.raw`
Result result = externalApi.call(request);
// 평소 0.1초인 호출이 5초 걸려도 아무 흔적이 없음
`,
          good: String.raw`
long start = System.nanoTime();
Result result = externalApi.call(request);
long ms = (System.nanoTime() - start) / 1_000_000;

if (ms > SLOW_THRESHOLD_MS) {
    log.warn("느린 외부 호출 api=inventory elapsedMs={} requestId={}", ms, request.id());
}
`,
        },
        {
          id: 'l10', short: `로그 파일`,
          title: `로그 파일은 나누고 오래된 것은 지우기`,
          ver: `Logback`,
          lang: 'plain',
          why: `파일 하나에 계속 이어 쓰면 몇 달 뒤 디스크가 가득 차 서버가 멈춥니다. 날짜와 크기로 나누고 보관 기간과 전체 용량을 제한합니다.`,
          bad: String.raw`
<!-- 파일 하나에 계속 이어 쓴다 -->
<appender name="FILE" class="ch.qos.logback.core.FileAppender">
    <file>logs/app.log</file>
</appender>
`,
          good: String.raw`
<appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
    <file>logs/app.log</file>
    <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
        <fileNamePattern>logs/app.%d{yyyy-MM-dd}.%i.log.gz</fileNamePattern>
        <maxFileSize>100MB</maxFileSize>     <!-- 파일 하나의 최대 크기 -->
        <maxHistory>30</maxHistory>          <!-- 30일치만 보관 -->
        <totalSizeCap>10GB</totalSizeCap>    <!-- 전체 용량 상한 -->
    </rollingPolicy>
</appender>
`,
        },
      ],
    },
    {
      id: 'java-26', no: 26, name: `빌드와 의존성 관리`,
      lead: `코드는 같은데 내 PC에서만 빌드되거나 어제 되던 빌드가 오늘 깨지는 일을 막는 습관입니다. 예시는 Gradle(Kotlin DSL) 기준이며 Maven에서도 원리는 같습니다.`,
      lessons: [
        {
          id: 'l1', short: `버전 고정`,
          title: `의존성 버전을 정확히 적기`,
          ver: `Gradle`,
          lang: 'plain',
          why: `"최신 버전"이나 범위로 적으면 빌드하는 날에 따라 다른 버전이 들어옵니다. 아무것도 안 바꿨는데 빌드가 깨지는 원인이 됩니다.`,
          bad: String.raw`
dependencies {
    implementation("com.google.guava:guava:latest.release")   // 빌드할 때마다 달라질 수 있음
    implementation("org.apache.commons:commons-lang3:3.+")
}
`,
          good: String.raw`
dependencies {
    implementation("com.google.guava:guava:33.3.1-jre")
    implementation("org.apache.commons:commons-lang3:3.17.0")
}
// 버전을 올릴 때는 직접 숫자를 바꾸고 테스트를 돌린다
`,
        },
        {
          id: 'l2', short: `의존성 범위`,
          title: `의존성은 쓰이는 범위에 맞게 선언`,
          ver: `Gradle`,
          lang: 'plain',
          why: `전부 implementation에 넣으면 테스트 도구와 컴파일 전용 도구까지 운영 배포물에 들어갑니다. 언제 필요한지에 따라 나눠 적습니다.`,
          bad: String.raw`
dependencies {
    implementation("org.junit.jupiter:junit-jupiter:5.11.3")   // 테스트 도구가 운영 jar에 포함됨
    implementation("org.projectlombok:lombok:1.18.36")         // 컴파일할 때만 필요한데 배포까지 됨
    implementation("com.mysql:mysql-connector-j:9.1.0")
}
`,
          good: String.raw`
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")   // 컴파일과 실행

    compileOnly("org.projectlombok:lombok:1.18.36")                      // 컴파일할 때만
    annotationProcessor("org.projectlombok:lombok:1.18.36")

    runtimeOnly("com.mysql:mysql-connector-j:9.1.0")                     // 실행할 때만

    testImplementation("org.junit.jupiter:junit-jupiter:5.11.3")         // 테스트에서만
}
`,
        },
        {
          id: 'l3', short: `BOM`,
          title: `서로 맞는 버전은 BOM에 맡기기`,
          ver: `Spring Boot`,
          lang: 'plain',
          why: `함께 동작하도록 만들어진 라이브러리들의 버전을 하나씩 손으로 적으면 어긋나기 쉽습니다. 스프링 부트는 검증된 버전 조합을 제공하므로 버전을 생략합니다.`,
          bad: String.raw`
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web:3.4.0")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa:3.3.2")   // 버전이 어긋남
    implementation("com.fasterxml.jackson.core:jackson-databind:2.15.0")            // 스프링이 기대하는 버전과 다름
}
`,
          good: String.raw`
plugins {
    id("org.springframework.boot") version "3.4.0"
    id("io.spring.dependency-management") version "1.1.6"
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")        // 버전 생략
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")   // 서로 맞는 버전으로 정렬됨
    implementation("com.fasterxml.jackson.core:jackson-databind")
}
`,
        },
        {
          id: 'l4', short: `Wrapper`,
          title: `빌드는 Gradle Wrapper로`,
          ver: `Gradle`,
          lang: 'plain',
          why: `PC에 설치된 Gradle로 빌드하면 사람마다, 서버마다 버전이 달라 결과가 달라집니다. Wrapper는 프로젝트에 정해진 버전을 자동으로 받아 씁니다.`,
          bad: String.raw`
gradle build
# 내 PC에 설치된 Gradle 버전으로 빌드됨
`,
          good: String.raw`
./gradlew build      # 맥, 리눅스
gradlew.bat build    # 윈도우

# gradlew, gradlew.bat, gradle/wrapper 폴더는 깃에 함께 올린다
`,
        },
        {
          id: 'l5', short: `의존성 정리`,
          title: `무엇이 왜 들어와 있는지 확인하기`,
          ver: `Gradle`,
          lang: 'plain',
          why: `"혹시 필요할까 봐" 넣어 둔 의존성은 취약점과 충돌의 원인이 됩니다. 실제로 무엇이 들어와 있는지 보고 쓰지 않는 것은 지웁니다.`,
          bad: String.raw`
// 왜 넣었는지 아무도 모르는 것들
implementation("commons-io:commons-io:2.11.0")
implementation("org.apache.httpcomponents:httpclient:4.5.13")
implementation("com.google.code.gson:gson:2.8.9")
`,
          good: String.raw`
./gradlew dependencies --configuration runtimeClasspath   # 전체 의존성 트리
./gradlew dependencyInsight --dependency gson             # 누가 이것을 끌어왔는지

# 쓰지 않는 것은 지운다
# 의존성이 적을수록 취약점도, 충돌도, 빌드 시간도 줄어든다
`,
        },
        {
          id: 'l6', short: `버전 충돌`,
          title: `버전 충돌은 확인하고 명시적으로 정하기`,
          ver: `Gradle`,
          lang: 'plain',
          why: `두 라이브러리가 같은 라이브러리의 다른 버전을 요구하면 하나만 선택됩니다. 무엇이 선택됐는지 모르면 실행 중에 메서드가 없다는 오류를 만납니다.`,
          bad: String.raw`
// A는 jackson 2.15를, B는 jackson 2.18을 요구
// 어느 버전이 선택됐는지 모른 채 실행 : NoSuchMethodError
`,
          good: String.raw`
./gradlew dependencyInsight --dependency jackson-databind   # 선택된 버전과 이유

dependencies {
    constraints {
        implementation("com.fasterxml.jackson.core:jackson-databind:2.18.2") {
            because("A와 B가 다른 버전을 요구해서 높은 쪽으로 맞춤")
        }
    }
}
`,
        },
        {
          id: 'l7', short: `.gitignore`,
          title: `빌드 결과물과 개인 설정은 깃에 올리지 않기`,
          ver: `Git`,
          lang: 'plain',
          why: `빌드 결과물과 IDE 설정은 사람마다 달라서 올리면 계속 충돌합니다. 비밀 값이 든 파일은 한 번 올라가면 기록에서 지우기 어렵습니다.`,
          bad: String.raw`
git add .
# build/, .idea/, *.class, .env 까지 전부 올라감
`,
          good: String.raw`
# .gitignore
build/
out/
.gradle/
.idea/
*.iml
*.class
.env
application-local.yml
`,
        },
        {
          id: 'l8', short: `버전 카탈로그`,
          title: `여러 모듈의 버전은 한 파일에서`,
          ver: `Gradle 7.4+`,
          lang: 'plain',
          why: `모듈마다 버전 문자열을 복사하면 한 곳만 올리고 다른 곳을 잊습니다. 버전 카탈로그에 한 번 적고 모든 모듈이 이름으로 가져다 씁니다.`,
          bad: String.raw`
// api/build.gradle.kts
implementation("com.fasterxml.jackson.core:jackson-databind:2.18.2")

// batch/build.gradle.kts
implementation("com.fasterxml.jackson.core:jackson-databind:2.17.0")   // 여기만 안 올림
`,
          good: String.raw`
# gradle/libs.versions.toml
[versions]
jackson = "2.18.2"

[libraries]
jackson-databind = { module = "com.fasterxml.jackson.core:jackson-databind", version.ref = "jackson" }

# 각 모듈의 build.gradle.kts
implementation(libs.jackson.databind)
`,
        },
        {
          id: 'l9', short: `저장소`,
          title: `jar 파일을 직접 넣지 말고 저장소에서 받기`,
          ver: `Gradle`,
          lang: 'plain',
          why: `프로젝트에 넣어 둔 jar 파일은 어디서 받은 몇 버전인지 알 수 없고, 내 PC의 경로를 가리키면 다른 사람은 빌드할 수 없습니다.`,
          bad: String.raw`
dependencies {
    implementation(files("libs/payment-sdk.jar"))                  // 출처와 버전을 알 수 없음
    implementation(files("C:/Users/kim/Downloads/util-1.2.jar"))   // 내 PC에서만 빌드됨
}
`,
          good: String.raw`
repositories {
    mavenCentral()
    maven { url = uri("https://nexus.example.com/repository/releases") }   // 사내 저장소
}

dependencies {
    implementation("com.pay:payment-sdk:2.4.1")   // 좌표와 버전으로 받는다
}
`,
        },
        {
          id: 'l10', short: `테스트 포함`,
          title: `테스트를 건너뛰고 빌드하지 않기`,
          ver: `Gradle`,
          lang: 'plain',
          why: `급하다고 테스트를 빼고 빌드하기 시작하면 깨진 테스트가 쌓이고, 결국 아무도 테스트를 믿지 않게 됩니다. 테스트는 빌드의 일부입니다.`,
          bad: String.raw`
./gradlew build -x test
# "급하니까 테스트는 건너뛰고"
`,
          good: String.raw`
./gradlew build   # build는 test를 포함한다

# CI에서는 모든 커밋과 PR마다 자동으로 돌리고, 실패하면 머지를 막는다
# 느려서 건너뛰고 싶다면 테스트를 빠르게 만든다 (24회차 01번, 02번)
`,
        },
      ],
    },
    {
      id: 'java-27', no: 27, name: `깃과 코드 리뷰`,
      lead: `코드는 혼자 쓰지만 저장소는 같이 씁니다. 다른 사람이 내 변경을 이해하고 안전하게 합칠 수 있게 하는 습관입니다.`,
      lessons: [
        {
          id: 'l1', short: `커밋 메시지`,
          title: `커밋 메시지에 무엇을 왜 바꿨는지 쓰기`,
          ver: `Git`,
          lang: 'plain',
          why: `"수정", "fix"만 적힌 기록은 여섯 달 뒤에 아무 도움이 되지 않습니다. 첫 줄에 무엇을 했는지, 본문에 왜 했는지를 씁니다.`,
          bad: String.raw`
git commit -m "수정"
git commit -m "fix"
git commit -m "작업 중"
git commit -m "asdf"
`,
          good: String.raw`
주문 취소 시 포인트가 환불되지 않는 문제 수정

취소 처리에서 결제 금액만 환불하고 사용한 포인트는 되돌리지 않았다.
Order.cancel()에서 포인트 환불 이벤트를 함께 발행하도록 변경.
`,
        },
        {
          id: 'l2', short: `작은 커밋`,
          title: `커밋 하나에는 한 가지 이유만`,
          ver: `Git`,
          lang: 'plain',
          why: `기능 추가, 리팩터링, 포맷 정리가 한 커밋에 섞이면 리뷰하기 어렵고 문제가 생겼을 때 일부만 되돌릴 수 없습니다.`,
          bad: String.raw`
git add .
git commit -m "회원 기능 개발"
# 파일 47개 : 새 기능 + 리팩터링 + 들여쓰기 정리 + 오타 수정이 한 덩어리
`,
          good: String.raw`
git commit -m "MemberService에서 등급 계산 로직 분리"    # 구조만
git commit -m "회원 등급별 할인율 적용"                   # 기능만
git commit -m "코드 포맷 정리"                            # 모양만

# 문제가 생기면 그 커밋 하나만 되돌릴 수 있다
`,
        },
        {
          id: 'l3', short: `브랜치`,
          title: `main에 직접 올리지 않기`,
          ver: `Git`,
          lang: 'plain',
          why: `main에 바로 올리면 리뷰도 자동 테스트도 거치지 않은 코드가 모두에게 퍼집니다. 작업은 브랜치에서 하고 풀 리퀘스트로 합칩니다.`,
          bad: String.raw`
git checkout main
git commit -m "결제 기능 추가"
git push origin main    # 리뷰도 테스트도 없이 바로 반영
`,
          good: String.raw`
git switch -c feature/payment    # 작업용 브랜치
git commit -m "결제 기능 추가"
git push -u origin feature/payment

# 풀 리퀘스트를 열어 리뷰와 자동 테스트를 거친 뒤 main에 합친다
`,
        },
        {
          id: 'l4', short: `비밀 정보`,
          title: `비밀번호와 키를 커밋하지 않기`,
          ver: `Git`,
          lang: 'plain',
          why: `한 번 올라간 값은 파일을 지워도 깃 기록에 남고, 공개 저장소라면 몇 분 안에 수집됩니다. 값은 환경 변수로 받고 파일은 깃에서 제외합니다.`,
          bad: String.raw`
# application.yml 을 그대로 커밋
spring.datasource.password: 실제-운영-비밀번호
payment.api-key: 실제-운영-키

# "나중에 지우면 되지" : 지워도 기록에는 그대로 남는다
`,
          good: String.raw`
# application.yml : 값은 환경 변수에서 받는다
spring.datasource.password: \${DB_PASSWORD}
payment.api-key: \${PAYMENT_API_KEY}

# .gitignore
.env
application-local.yml
`,
          note: `이미 올려 버렸다면 파일을 지우는 것으로는 부족합니다. <strong>그 비밀번호와 키를 즉시 새것으로 바꿉니다.</strong>`,
        },
        {
          id: 'l5', short: `force push`,
          title: `공유 브랜치에 강제 푸시하지 않기`,
          ver: `Git`,
          lang: 'plain',
          why: `강제 푸시는 원격의 기록을 내 것으로 덮어씁니다. 그 사이에 다른 사람이 올린 커밋이 통째로 사라집니다. 잘못된 커밋은 되돌리는 커밋을 새로 만들어 고칩니다.`,
          bad: String.raw`
git push --force origin main
# 다른 사람이 올린 커밋이 사라짐
`,
          good: String.raw`
# 공유 브랜치의 잘못된 커밋은 "되돌리는 커밋"을 새로 만든다
git revert a1b2c3d
git push origin main

# 내 작업 브랜치를 정리한 뒤 올릴 때만, 더 안전한 옵션으로
git push --force-with-lease origin feature/payment
`,
        },
        {
          id: 'l6', short: `PR`,
          title: `풀 리퀘스트는 작게, 설명과 함께`,
          lang: 'plain',
          why: `수천 줄짜리 변경은 아무도 제대로 읽지 못하고 "좋아 보여요"로 통과됩니다. 작게 나누고, 읽는 사람이 맥락을 알 수 있게 설명을 붙입니다.`,
          bad: String.raw`
제목 : 기능 개발
설명 : (없음)
변경 : 파일 82개, +3,400 / -1,200
`,
          good: String.raw`
제목 : 주문 취소 시 포인트 환불

무엇을   취소할 때 사용한 포인트를 되돌려 준다
왜       포인트를 쓴 주문을 취소하면 포인트가 사라진다는 문의
어떻게   Order.cancel()에서 환불 이벤트 발행, PointService가 수신
확인     단위 테스트 3개 추가, 스테이징에서 직접 취소해 봄

변경 : 파일 6개, +140 / -22
`,
        },
        {
          id: 'l7', short: `리뷰 코멘트`,
          title: `리뷰는 이유와 제안을 함께`,
          lang: 'plain',
          why: `"이상한데요"는 무엇을 어떻게 고치라는 것인지 알 수 없고 감정만 상합니다. 무엇이 왜 걱정되는지, 어떻게 하면 좋을지를 구체적으로 씁니다.`,
          bad: String.raw`
이거 왜 이렇게 짰어요?
이상한데요.
다시 짜세요.
`,
          good: String.raw`
여기서 orders가 비어 있으면 get(0)에서 예외가 날 것 같습니다.
isEmpty 검사를 먼저 하거나 findFirst()를 쓰면 어떨까요?

[질문] 이 값을 캐시하지 않은 이유가 있을까요? 호출이 잦아 보여서요.
[사소] 변수 이름이 temp보다 expiredCoupons면 더 읽기 쉬울 것 같아요.
`,
        },
        {
          id: 'l8', short: `포매터`,
          title: `코드 모양은 사람이 아니라 도구가 맞추기`,
          ver: `Spotless`,
          lang: 'plain',
          why: `들여쓰기와 공백을 사람이 지적하면 리뷰 시간이 거기에 다 쓰이고 정작 로직은 보지 못합니다. 포맷은 도구가 자동으로 맞추고 검사하게 합니다.`,
          bad: String.raw`
리뷰 코멘트 14개
- 들여쓰기가 탭이네요. 스페이스로 바꿔 주세요
- 여기 중괄호 앞에 공백이 없어요
- import 순서가 틀렸어요
`,
          good: String.raw`
// build.gradle.kts
plugins {
    id("com.diffplug.spotless") version "6.25.0"
}
spotless {
    java { googleJavaFormat() }
}

./gradlew spotlessApply    # 자동으로 맞춤
./gradlew spotlessCheck    # CI에서 검사 : 어긋나면 실패
`,
        },
        {
          id: 'l9', short: `충돌 해결`,
          title: `충돌은 양쪽의 의도를 확인하고 합치기`,
          ver: `Git`,
          lang: 'plain',
          why: `"내 코드가 맞겠지" 하고 한쪽만 남기면 상대방의 변경이 조용히 사라집니다. 양쪽이 각각 무엇을 하려던 것인지 보고 둘 다 살립니다.`,
          bad: String.raw`
<<<<<<< HEAD
int fee = total >= 50000 ? 0 : 3000;
=======
int fee = isVip ? 0 : 3000;
>>>>>>> feature/vip

# 한쪽만 남기고 끝냄 : 상대방의 변경이 사라진다
`,
          good: String.raw`
# 1. 양쪽이 각각 무엇을 하려던 변경인지 본다
git log --merge -p src/main/java/Shipping.java

# 2. 두 의도를 모두 살려 합친다
int fee = (isVip || total >= 50000) ? 0 : 3000;

# 3. 테스트를 돌려 확인한 뒤 커밋한다
./gradlew test
`,
          note: `어느 쪽이 맞는지 판단이 서지 않으면 <strong>혼자 정하지 말고 상대방에게 물어봅니다.</strong>`,
        },
        {
          id: 'l10', short: `커밋 전 확인`,
          title: `올리기 전에 무엇이 들어가는지 보기`,
          ver: `Git`,
          lang: 'plain',
          why: `git add . 로 전부 담으면 디버깅용 출력, 임시 파일, 관계없는 수정이 같이 올라갑니다. 담기 전에 보고, 담은 뒤에 한 번 더 봅니다.`,
          bad: String.raw`
git add .
git commit -m "버그 수정"
git push
# 디버깅용 출력과 임시 파일까지 함께 올라감
`,
          good: String.raw`
git status           # 어떤 파일이 바뀌었는지
git diff             # 무엇이 바뀌었는지
git add -p           # 변경을 조각별로 보면서 골라 담는다
git diff --staged    # 커밋에 들어갈 내용을 마지막으로 확인
git commit -m "주문 금액 계산에서 할인이 두 번 적용되는 문제 수정"
`,
        },
      ],
    },
    {
      id: 'java-28', no: 28, name: `아키텍처와 패키지 구조`,
      lead: `클래스 하나를 잘 짜는 것에서 한 걸음 물러나, 클래스들을 어디에 두고 누가 누구를 알게 할지를 다룹니다. 프로젝트가 커져도 고치기 쉬운 구조가 목표입니다.`,
      lessons: [
        {
          id: 'l1', short: `의존 방향`,
          title: `의존은 한 방향으로`,
          why: `서비스가 HTTP 요청 객체를 받거나 저장소가 화면 응답 모양을 알면, 화면이 바뀔 때 안쪽 계층까지 고쳐야 합니다. 바깥이 안쪽을 알고, 안쪽은 바깥을 모르게 합니다.`,
          bad: String.raw`
@Service
public class OrderService {
    public OrderResponse place(HttpServletRequest request) {   // 서비스가 웹을 알고 있음
        String userId = request.getHeader("X-User-Id");
        ...
    }
}

@Repository
public class OrderRepository {
    public OrderResponse findResponse(long id) { ... }         // 저장소가 응답 모양을 알고 있음
}
`,
          good: String.raw`
// Controller → Service → Repository
@RestController
public class OrderController {
    @PostMapping("/orders")
    public OrderResponse place(@RequestHeader("X-User-Id") long userId,
                               @RequestBody OrderRequest request) {
        Order order = orderService.place(userId, request.toCommand());   // 웹의 것은 여기서 벗긴다
        return OrderResponse.from(order);
    }
}
`,
        },
        {
          id: 'l2', short: `패키지`,
          title: `패키지는 계층이 아니라 기능으로 나누기`,
          lang: 'plain',
          why: `controller, service, repository로만 나누면 기능 하나를 고칠 때 모든 패키지를 오가야 합니다. 함께 바뀌는 것끼리 한 패키지에 둡니다.`,
          bad: String.raw`
com.shop
 ├─ controller    OrderController, MemberController ... 40개
 ├─ service       OrderService, MemberService ... 40개
 ├─ repository    ...
 └─ dto           ...
`,
          good: String.raw`
com.shop
 ├─ order
 │   ├─ OrderController
 │   ├─ OrderService
 │   ├─ OrderRepository
 │   └─ Order
 ├─ member
 └─ product
`,
          note: `패키지 이름만 봐도 <strong>무슨 일을 하는 서비스인지</strong> 보여야 합니다.`,
        },
        {
          id: 'l3', short: `순수한 도메인`,
          title: `업무 규칙이 웹 프레임워크를 모르게`,
          why: `업무 규칙을 담은 클래스가 세션이나 HTTP 응답 타입을 쓰면 웹 없이는 테스트할 수 없고 배치나 메시지 처리에서 재사용할 수도 없습니다.`,
          bad: String.raw`
public class Order {
    public ResponseEntity<String> cancel(HttpSession session) {   // 웹 타입에 묶임
        if (session.getAttribute("user") == null) {
            return ResponseEntity.status(401).body("로그인 필요");
        }
        this.status = OrderStatus.CANCELED;
        return ResponseEntity.ok("취소됨");
    }
}
`,
          good: String.raw`
public class Order {
    public void cancel() {   // 순수한 자바 : 규칙만 안다
        if (status == OrderStatus.SHIPPED) {
            throw new IllegalStateException("배송 시작 후에는 취소할 수 없습니다");
        }
        this.status = OrderStatus.CANCELED;
    }
}
// 로그인 확인과 응답 만들기는 컨트롤러의 일이다
`,
        },
        {
          id: 'l4', short: `의존 뒤집기`,
          title: `업무 코드가 기술에 의존하지 않게`,
          why: `주문 코드가 SMTP 메일 클래스를 직접 쓰면 알림 방식을 바꿀 때 주문 코드를 고쳐야 합니다. 주문 쪽이 필요한 것을 인터페이스로 정하고, 기술 쪽이 그것을 구현합니다.`,
          bad: String.raw`
package com.shop.order;

public class OrderService {
    private final SmtpMailSender mailSender;   // 주문이 메일 전송 기술에 직접 의존
}
`,
          good: String.raw`
package com.shop.order;

public interface OrderNotifier {   // 주문 쪽이 "내가 필요한 것"을 정한다
    void orderPlaced(Order order);
}

public class OrderService {
    private final OrderNotifier notifier;
}

// com.shop.infra.mail 패키지 : 기술 쪽이 그 인터페이스를 구현한다
public class SmtpOrderNotifier implements OrderNotifier { ... }
`,
        },
        {
          id: 'l5', short: `Utils`,
          title: `무엇이든 담는 Utils 클래스 만들지 않기`,
          why: `CommonUtils는 둘 곳을 모르는 코드가 모이는 곳이 됩니다. 업무 규칙까지 흘러 들어가고 모든 클래스가 의존하게 됩니다. 규칙은 그 데이터를 가진 클래스에 둡니다.`,
          bad: String.raw`
public class CommonUtils {
    public static String maskCard(String card) { ... }
    public static long calcShippingFee(Order order) { ... }   // 주문 규칙이 여기에
    public static boolean isVip(Member member) { ... }        // 회원 규칙도 여기에
    public static String toJson(Object o) { ... }
    // 3000줄
}
`,
          good: String.raw`
order.shippingFee();   // 주문 규칙은 Order에
member.isVip();        // 회원 규칙은 Member에

// 어디에도 속하지 않는 진짜 공통 기능만, 주제별로 작게
public final class CardMasker { ... }
public final class JsonMapper { ... }
`,
        },
        {
          id: 'l6', short: `패키지 순환`,
          title: `패키지끼리 서로 참조하지 않기`,
          why: `주문이 회원을, 회원이 주문을 참조하면 둘은 사실상 한 덩어리가 되어 따로 고치거나 떼어 낼 수 없습니다. 영역 사이에서는 객체 대신 id로 가리킵니다.`,
          bad: String.raw`
package com.shop.order;
import com.shop.member.Member;   // 주문 → 회원

package com.shop.member;
import com.shop.order.Order;     // 회원 → 주문

public class Member {
    private List<Order> orders;
}
`,
          good: String.raw`
package com.shop.order;

public class Order {
    private Long memberId;       // 다른 영역은 id로 가리킨다
}

// 회원은 주문을 모른다. 회원의 주문 목록이 필요하면 주문 쪽에 묻는다
List<Order> orders = orderRepository.findByMemberId(memberId);
`,
        },
        {
          id: 'l7', short: `접근 제어`,
          title: `밖에서 쓸 것만 public`,
          why: `전부 public이면 다른 패키지에서 내부 클래스를 가져다 쓰기 시작하고, 그 뒤로는 마음대로 바꿀 수 없습니다. 공개할 입구만 열고 나머지는 패키지 안에 둡니다.`,
          bad: String.raw`
package com.shop.order;

public class OrderService { ... }
public class OrderValidator { ... }         // 주문 안에서만 쓰는데 public
public class OrderPriceCalculator { ... }   // 밖에서 쓰기 시작하면 못 바꿈
`,
          good: String.raw`
package com.shop.order;

public class OrderService { ... }   // 밖에 공개하는 입구

class OrderValidator { ... }        // 접근 제어자를 생략하면 패키지 안에서만 보인다
class OrderPriceCalculator { ... }
`,
        },
        {
          id: 'l8', short: `상수 클래스`,
          title: `상수는 쓰는 곳 가까이에`,
          why: `모든 상수를 Constants 한 파일에 모으면 서로 관계없는 값 수백 개가 섞이고, 무엇이 어디에 쓰이는지 알 수 없게 됩니다.`,
          bad: String.raw`
public class Constants {
    public static final int MAX_LOGIN_ATTEMPTS = 5;
    public static final long FREE_SHIPPING_AMOUNT = 50_000;
    public static final String ORDER_STATUS_PAID = "PAID";
    public static final int PAGE_SIZE = 20;
    // 400개
}
`,
          good: String.raw`
class LoginPolicy {
    private static final int MAX_ATTEMPTS = 5;
}

class ShippingPolicy {
    private static final long FREE_SHIPPING_AMOUNT = 50_000;
}

enum OrderStatus { PAID, CANCELED }   // 상태 값은 enum으로
`,
        },
        {
          id: 'l9', short: `예외 번역`,
          title: `기술 예외는 업무의 말로 바꿔 올리기`,
          why: `DB 예외가 컨트롤러까지 그대로 올라가면 위쪽 계층이 저장 기술을 알아야 합니다. 저장소를 바꾸면 예외 처리까지 전부 바뀝니다. 경계에서 업무 예외로 바꿉니다.`,
          bad: String.raw`
@ExceptionHandler(DataIntegrityViolationException.class)   // 컨트롤러가 DB 예외를 해석
public ResponseEntity<String> handle() {
    return ResponseEntity.status(409).body("중복");
}
`,
          good: String.raw`
public void register(Member member) {
    try {
        memberRepository.save(member);
    } catch (DataIntegrityViolationException e) {
        throw new DuplicateEmailException(member.getEmail(), e);   // 업무의 말로 바꾼다
    }
}

@ExceptionHandler(DuplicateEmailException.class)   // 위쪽은 업무 예외만 안다
public ResponseEntity<ErrorResponse> handle(DuplicateEmailException e) { ... }
`,
        },
        {
          id: 'l10', short: `계층 수`,
          title: `넘기기만 하는 계층은 두지 않기`,
          lang: 'plain',
          why: `"나중에 필요할지 몰라서" 만든 계층은 호출을 그대로 넘기기만 하면서 읽을 코드와 고칠 곳만 늘립니다. 계층은 하는 일이 있을 때 둡니다.`,
          bad: String.raw`
// 회원 한 명 조회에 클래스 여섯 개를 지나간다
MemberController → MemberFacade → MemberService → MemberManager → MemberDao → MemberRepository

class MemberManager {
    Member find(long id) { return memberDao.find(id); }   // 그대로 넘기기만 함
}
`,
          good: String.raw`
MemberController → MemberService → MemberRepository

// 필요해지면 그때 추가해도 늦지 않다
`,
        },
      ],
    },
    {
      id: 'java-29', no: 29, name: `코딩 테스트 패턴`,
      lead: `자바로 알고리즘 문제를 풀 때 쓰는 기본기입니다. 답은 맞는데 시간 초과가 나는 코드를 통과하는 코드로 바꾸는 전형적인 방법들입니다.`,
      lessons: [
        {
          id: 'l1', short: `빠른 입력`,
          title: `입력이 많으면 BufferedReader`,
          why: `Scanner는 편하지만 느립니다. 입력이 수십만 개를 넘으면 읽는 것만으로 시간 초과가 납니다.`,
          bad: String.raw`
Scanner sc = new Scanner(System.in);
int n = sc.nextInt();
for (int i = 0; i < n; i++) {
    int x = sc.nextInt();   // 입력이 100만 개면 이것만으로 시간 초과
}
`,
          good: String.raw`
BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
int n = Integer.parseInt(br.readLine());

StringTokenizer st = new StringTokenizer(br.readLine());
for (int i = 0; i < n; i++) {
    int x = Integer.parseInt(st.nextToken());
}
`,
        },
        {
          id: 'l2', short: `모아서 출력`,
          title: `출력은 모아서 한 번에`,
          why: `println은 부를 때마다 화면으로 내보냅니다. 여러 줄을 출력할 때는 StringBuilder에 모았다가 한 번에 내보냅니다.`,
          bad: String.raw`
for (int i = 0; i < n; i++) {
    System.out.println(answer[i]);   // 10만 줄이면 느림
}
`,
          good: String.raw`
StringBuilder sb = new StringBuilder();
for (int i = 0; i < n; i++) {
    sb.append(answer[i]).append('\n');
}
System.out.print(sb);
`,
        },
        {
          id: 'l3', short: `빈도 세기`,
          title: `개수 세기는 Map이나 배열로 한 번에`,
          why: `원소마다 전체를 다시 훑으면 데이터가 10배 늘 때 시간이 100배 늡니다. 한 번 훑으면서 세어 두면 끝납니다.`,
          bad: String.raw`
for (String word : words) {
    int count = 0;
    for (String other : words) {
        if (word.equals(other)) count++;   // 단어마다 전체를 다시 셈
    }
}
`,
          good: String.raw`
Map<String, Integer> count = new HashMap<>();
for (String word : words) {
    count.merge(word, 1, Integer::sum);
}

// 알파벳 소문자만 나오면 배열이 더 빠르다
int[] freq = new int[26];
for (char c : s.toCharArray()) freq[c - 'a']++;
`,
        },
        {
          id: 'l4', short: `투 포인터`,
          title: `정렬된 배열은 양 끝에서 좁혀 오기`,
          why: `정렬되어 있다는 사실을 이용하면 모든 쌍을 볼 필요가 없습니다. 합이 작으면 왼쪽을, 크면 오른쪽을 움직이면 한 번 훑는 것으로 끝납니다.`,
          bad: String.raw`
// 정렬된 배열에서 합이 target인 두 수 찾기
for (int i = 0; i < n; i++) {
    for (int j = i + 1; j < n; j++) {
        if (arr[i] + arr[j] == target) return true;   // 모든 쌍을 확인
    }
}
return false;
`,
          good: String.raw`
int left = 0, right = n - 1;
while (left < right) {
    int sum = arr[left] + arr[right];
    if (sum == target) return true;
    if (sum < target) left++;   // 합이 작으면 왼쪽을 키우고
    else right--;               // 크면 오른쪽을 줄인다
}
return false;
`,
        },
        {
          id: 'l5', short: `스택 · 큐`,
          title: `스택과 큐는 ArrayDeque`,
          why: `Stack은 오래된 클래스라 모든 메서드에 락이 걸려 있고, LinkedList는 원소마다 객체를 따로 만듭니다. ArrayDeque 하나로 스택과 큐를 모두 씁니다.`,
          bad: String.raw`
Stack<Integer> stack = new Stack<>();
LinkedList<int[]> queue = new LinkedList<>();
`,
          good: String.raw`
Deque<Integer> stack = new ArrayDeque<>();
stack.push(1);
int top = stack.pop();

Deque<int[]> queue = new ArrayDeque<>();
queue.offer(new int[] {0, 0});
int[] cur = queue.poll();
`,
        },
        {
          id: 'l6', short: `우선순위 큐`,
          title: `가장 큰 것 k개는 PriorityQueue`,
          why: `값이 들어올 때마다 전체를 정렬하면 낭비입니다. 우선순위 큐는 넣고 빼는 것만으로 가장 작은 값이나 큰 값을 맨 위에 유지합니다.`,
          bad: String.raw`
List<Integer> list = new ArrayList<>();
for (int x : nums) {
    list.add(x);
    Collections.sort(list);   // 넣을 때마다 전체 정렬
}
`,
          good: String.raw`
PriorityQueue<Integer> pq = new PriorityQueue<>();   // 작은 값이 맨 위
for (int x : nums) {
    pq.offer(x);
    if (pq.size() > k) pq.poll();   // k개를 넘으면 가장 작은 것을 버린다
}
// pq에 남은 것이 가장 큰 k개

PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());
`,
        },
        {
          id: 'l7', short: `이분 탐색`,
          title: `이분 탐색의 중간값은 넘치지 않게`,
          why: `두 값을 더한 뒤 나누면 합이 int 범위를 넘을 때 음수가 됩니다. 답의 범위를 이분 탐색하는 문제에서 자주 걸립니다.`,
          bad: String.raw`
int lo = 0, hi = 2_000_000_000;
while (lo <= hi) {
    int mid = (lo + hi) / 2;   // lo + hi 가 int 범위를 넘으면 음수
    if (enough(mid)) hi = mid - 1;
    else lo = mid + 1;
}
`,
          good: String.raw`
int lo = 0, hi = 2_000_000_000;
while (lo <= hi) {
    int mid = lo + (hi - lo) / 2;   // 넘치지 않는 중간값
    if (enough(mid)) hi = mid - 1;
    else lo = mid + 1;
}

// 정렬된 배열에서 찾기만 하면
int index = Arrays.binarySearch(arr, target);   // 없으면 음수
`,
        },
        {
          id: 'l8', short: `누적합`,
          title: `구간 합을 여러 번 물으면 누적합`,
          why: `질문마다 구간을 다시 더하면 질문 수와 구간 길이가 곱해집니다. 앞에서부터의 합을 미리 구해 두면 질문 하나를 뺄셈 한 번으로 답합니다.`,
          bad: String.raw`
for (int[] q : queries) {   // 질문 10만 개
    long sum = 0;
    for (int i = q[0]; i <= q[1]; i++) sum += arr[i];   // 질문마다 다시 더함
    answer.add(sum);
}
`,
          good: String.raw`
long[] prefix = new long[n + 1];
for (int i = 0; i < n; i++) {
    prefix[i + 1] = prefix[i] + arr[i];   // 앞에서부터의 합
}

for (int[] q : queries) {
    answer.add(prefix[q[1] + 1] - prefix[q[0]]);   // 뺄셈 한 번
}
`,
        },
        {
          id: 'l9', short: `메모이제이션`,
          title: `같은 계산을 반복하면 저장해 두기`,
          why: `단순 재귀는 같은 값을 수없이 다시 계산합니다. 한 번 구한 값을 저장해 두면 지수 시간이 선형 시간으로 줄어듭니다.`,
          bad: String.raw`
long fib(int n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);   // n이 50이면 끝나지 않음
}
`,
          good: String.raw`
long[] memo = new long[91];

long fib(int n) {
    if (n <= 1) return n;
    if (memo[n] != 0) return memo[n];   // 계산한 적 있으면 꺼내 쓴다
    return memo[n] = fib(n - 1) + fib(n - 2);
}

// 또는 아래에서부터 채운다
long[] dp = new long[n + 1];
dp[1] = 1;
for (int i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];
`,
        },
        {
          id: 'l10', short: `BFS`,
          title: `격자의 최단 거리는 BFS와 방문 표시`,
          why: `방문 표시 없이 모든 경로를 따라가면 같은 칸을 끝없이 다시 방문합니다. BFS는 가까운 칸부터 퍼져 나가므로 처음 도착했을 때가 최단 거리입니다.`,
          bad: String.raw`
// 방문 표시 없이 재귀로 모든 경로를 탐색
int shortest(int r, int c) {
    if (r == goalR && c == goalC) return 0;
    int best = Integer.MAX_VALUE;
    for (int d = 0; d < 4; d++) {
        best = Math.min(best, 1 + shortest(r + dr[d], c + dc[d]));
    }
    return best;
}
`,
          good: String.raw`
int[] dr = {1, -1, 0, 0}, dc = {0, 0, 1, -1};
int[][] dist = new int[rows][cols];
for (int[] row : dist) Arrays.fill(row, -1);   // -1 : 아직 방문 안 함

Deque<int[]> queue = new ArrayDeque<>();
queue.offer(new int[] {0, 0});
dist[0][0] = 0;

while (!queue.isEmpty()) {
    int[] cur = queue.poll();
    for (int d = 0; d < 4; d++) {
        int nr = cur[0] + dr[d], nc = cur[1] + dc[d];
        if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
        if (grid[nr][nc] == 1 || dist[nr][nc] != -1) continue;   // 벽이거나 이미 방문
        dist[nr][nc] = dist[cur[0]][cur[1]] + 1;
        queue.offer(new int[] {nr, nc});
    }
}
// dist[goalR][goalC] 가 최단 거리
`,
        },
      ],
    },
    {
      id: 'java-30', no: 30, name: `Java 21까지의 새 기능`,
      lead: `3회차 이후에 추가된 문법과 API입니다. 제목 옆 숫자는 쓸 수 있는 최소 자바 버전이며, 대부분 Java 21에서 정식 기능이 됐습니다.`,
      lessons: [
        {
          id: 'l1', short: `instanceof 패턴`,
          title: `instanceof와 캐스팅을 한 번에`,
          ver: `Java 16+`,
          why: `타입을 검사한 다음 줄에서 다시 캐스팅하는 것은 같은 말을 두 번 하는 것입니다. 검사와 동시에 그 타입의 변수를 받습니다.`,
          bad: String.raw`
if (shape instanceof Circle) {
    Circle circle = (Circle) shape;   // 검사하고, 또 캐스팅
    return circle.radius() * 2;
}
`,
          good: String.raw`
if (shape instanceof Circle circle) {
    return circle.radius() * 2;
}

// 조건을 이어 쓸 수도 있다
if (obj instanceof String s && !s.isBlank()) { ... }
`,
        },
        {
          id: 'l2', short: `레코드 패턴`,
          title: `레코드는 꺼내면서 바로 풀어 받기`,
          ver: `Java 21+`,
          why: `레코드를 받은 뒤 접근자를 하나씩 불러 변수에 담는 대신, 검사하는 자리에서 안의 값을 바로 변수로 받습니다.`,
          bad: String.raw`
if (obj instanceof Point p) {
    int x = p.x();
    int y = p.y();
    System.out.println(x + y);
}
`,
          good: String.raw`
if (obj instanceof Point(int x, int y)) {
    System.out.println(x + y);
}
`,
        },
        {
          id: 'l3', short: `when`,
          title: `switch의 case에 조건 붙이기`,
          ver: `Java 21+`,
          why: `타입으로 나눈 뒤 다시 if로 조건을 따지면 분기가 두 겹이 됩니다. case 뒤에 when으로 조건을 붙이면 한 겹으로 펴집니다.`,
          bad: String.raw`
String describe(Shape shape) {
    if (shape instanceof Circle c) {
        if (c.radius() > 100) return "큰 원";
        return "원";
    } else if (shape instanceof Square s) {
        return "사각형";
    }
    return "모름";
}
`,
          good: String.raw`
String describe(Shape shape) {
    return switch (shape) {
        case Circle c when c.radius() > 100 -> "큰 원";
        case Circle c -> "원";
        case Square s -> "사각형";
    };
}
`,
          note: `case는 위에서부터 차례로 검사합니다. <strong>조건이 붙은 case를 먼저</strong> 써야 합니다.`,
        },
        {
          id: 'l4', short: `case null`,
          title: `switch에서 null도 case로`,
          ver: `Java 21+`,
          why: `switch에 null이 들어오면 NullPointerException이 납니다. 그래서 switch 앞에 null 검사를 따로 두곤 했는데, 이제 case 하나로 쓸 수 있습니다.`,
          bad: String.raw`
String label(Status status) {
    if (status == null) return "없음";   // 빠뜨리면 NullPointerException
    switch (status) {
        case PAID: return "결제완료";
        default: return "기타";
    }
}
`,
          good: String.raw`
String label(Status status) {
    return switch (status) {
        case null -> "없음";
        case PAID -> "결제완료";
        default -> "기타";
    };
}
`,
        },
        {
          id: 'l5', short: `중첩 패턴`,
          title: `겹친 레코드도 한 번에 풀기`,
          ver: `Java 21+`,
          why: `레코드 안에 레코드가 있으면 접근자를 여러 번 타고 들어가야 합니다. 패턴을 겹쳐 쓰면 가장 안쪽 값까지 한 번에 받습니다.`,
          bad: String.raw`
if (obj instanceof Line line) {
    Point start = line.start();
    Point end = line.end();
    int width = end.x() - start.x();
    int height = end.y() - start.y();
}
`,
          good: String.raw`
record Point(int x, int y) {}
record Line(Point start, Point end) {}

if (obj instanceof Line(Point(var x1, var y1), Point(var x2, var y2))) {
    int width = x2 - x1;
    int height = y2 - y1;
}
`,
        },
        {
          id: 'l6', short: `getFirst · getLast`,
          title: `첫 원소와 마지막 원소를 바로 꺼내기`,
          ver: `Java 21+`,
          why: `마지막 원소를 꺼내려고 size에서 1을 빼거나, 첫 원소를 꺼내려고 반복자를 쓰던 코드가 메서드 하나로 바뀝니다. List, Deque, LinkedHashSet에서 같은 이름으로 씁니다.`,
          bad: String.raw`
String last = list.get(list.size() - 1);
String first = linkedHashSet.iterator().next();

List<String> reversed = new ArrayList<>(list);
Collections.reverse(reversed);
`,
          good: String.raw`
String last = list.getLast();
String first = linkedHashSet.getFirst();

List<String> reversed = list.reversed();   // 뒤집어 보는 뷰 : 복사하지 않는다

list.addFirst("맨 앞");
list.removeLast();
`,
        },
        {
          id: 'l7', short: `가상 스레드`,
          title: `기다리는 작업이 많으면 가상 스레드`,
          ver: `Java 21+`,
          why: `일반 스레드는 외부 응답을 기다리는 동안에도 자리를 차지해서, 풀 크기만큼만 동시에 처리합니다. 가상 스레드는 기다리는 동안 자리를 비켜 주므로 수만 개를 만들어도 됩니다.`,
          bad: String.raw`
// 외부 API를 기다리는 작업 1만 개 : 200개가 차면 나머지는 줄을 선다
ExecutorService pool = Executors.newFixedThreadPool(200);
for (Request request : requests) {
    pool.submit(() -> callSlowApi(request));
}
`,
          good: String.raw`
try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (Request request : requests) {
        executor.submit(() -> callSlowApi(request));   // 작업마다 가상 스레드 하나
    }
}   // 블록을 나갈 때 모든 작업이 끝나기를 기다린다
`,
          note: `효과가 있는 것은 네트워크나 DB를 <strong>기다리는 시간이 긴 작업</strong>입니다. 계산만 하는 작업은 빨라지지 않습니다.`,
        },
        {
          id: 'l8', short: `Semaphore`,
          title: `가상 스레드는 풀에 넣지 않기`,
          ver: `Java 21+`,
          why: `가상 스레드는 만들고 버리는 것이 싸서 재사용할 이유가 없습니다. 동시에 실행되는 수를 제한하고 싶다면 풀 크기가 아니라 Semaphore로 제한합니다.`,
          bad: String.raw`
// 가상 스레드를 풀에 넣어 개수를 제한하려 함
ExecutorService pool = Executors.newFixedThreadPool(100, Thread.ofVirtual().factory());
`,
          good: String.raw`
Semaphore limit = new Semaphore(100);   // 동시에 100개까지만

executor.submit(() -> {
    limit.acquire();
    try {
        return callSlowApi(request);
    } finally {
        limit.release();
    }
});
`,
        },
        {
          id: 'l9', short: `Math.clamp`,
          title: `범위 안으로 맞추기는 Math.clamp`,
          ver: `Java 21+`,
          why: `max와 min을 겹쳐 쓰면 어느 쪽이 최소이고 최대인지 헷갈려 순서를 자주 틀립니다. clamp는 값, 최소, 최대 순서로 읽힙니다.`,
          bad: String.raw`
int volume = Math.max(0, Math.min(100, input));   // 어느 쪽이 최소이고 최대인지

int page = input;
if (page < 1) page = 1;
if (page > 100) page = 100;
`,
          good: String.raw`
int volume = Math.clamp(input, 0, 100);   // 값, 최소, 최대

int page = Math.clamp(input, 1, 100);
`,
        },
        {
          id: 'l10', short: `HttpClient`,
          title: `HTTP 호출은 HttpClient`,
          ver: `Java 11+`,
          why: `HttpURLConnection은 응답을 직접 읽어 모아야 하고 타임아웃을 빠뜨리기 쉽습니다. HttpClient는 요청을 조립하듯 쓰고 응답 본문을 원하는 형태로 받습니다.`,
          bad: String.raw`
HttpURLConnection con = (HttpURLConnection) new URL(url).openConnection();
con.setRequestMethod("GET");
BufferedReader in = new BufferedReader(new InputStreamReader(con.getInputStream()));
StringBuilder body = new StringBuilder();
String line;
while ((line = in.readLine()) != null) body.append(line);
in.close();
`,
          good: String.raw`
HttpClient client = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(3))
        .build();

HttpRequest request = HttpRequest.newBuilder(URI.create(url))
        .timeout(Duration.ofSeconds(5))
        .GET()
        .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
int status = response.statusCode();
String body = response.body();
`,
        },
      ],
    },
    {
      id: 'java-31', no: 31, name: `스프링 시큐리티`,
      lead: `19회차의 보안 원칙을 스프링 시큐리티로 구현할 때의 습관입니다. 설정 한 줄의 순서나 기본값 차이로 전체가 열려 버리는 지점들을 모았습니다.`,
      lessons: [
        {
          id: 'l1', short: `PasswordEncoder`,
          title: `비밀번호 인코더는 바꿀 수 있는 형태로 등록`,
          ver: `Spring Security`,
          why: `인코더를 하나로 고정하면 더 강한 알고리즘으로 옮길 때 기존 비밀번호를 검증할 수 없게 됩니다. 저장할 때 알고리즘 표시를 함께 남기는 인코더를 씁니다.`,
          bad: String.raw`
@Bean
public PasswordEncoder passwordEncoder() {
    return NoOpPasswordEncoder.getInstance();   // 비밀번호를 그대로 저장하고 그대로 비교
}
`,
          good: String.raw`
@Bean
public PasswordEncoder passwordEncoder() {
    return PasswordEncoderFactories.createDelegatingPasswordEncoder();
}
// 저장되는 값 : {bcrypt}$2a$10$...
// 앞의 표시 덕분에 나중에 알고리즘을 바꿔도 기존 비밀번호를 그대로 검증한다
`,
        },
        {
          id: 'l2', short: `기본 거부`,
          title: `공개할 것만 적고 나머지는 막기`,
          ver: `Spring Security`,
          why: `"나머지는 전부 허용"으로 두면 새로 만든 API가 자동으로 공개됩니다. 공개할 주소만 적고 나머지는 로그인을 요구하게 합니다.`,
          bad: String.raw`
@Bean
SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.authorizeHttpRequests(auth -> auth
            .requestMatchers("/admin/**").hasRole("ADMIN")
            .anyRequest().permitAll());   // 새로 만든 API도 자동으로 공개됨
    return http.build();
}
`,
          good: String.raw`
@Bean
SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.authorizeHttpRequests(auth -> auth
            .requestMatchers("/", "/login", "/signup").permitAll()   // 공개할 것만 적는다
            .requestMatchers("/admin/**").hasRole("ADMIN")
            .anyRequest().authenticated());                          // 나머지는 로그인 필요
    return http.build();
}
`,
        },
        {
          id: 'l3', short: `규칙 순서`,
          title: `좁은 규칙을 먼저, 넓은 규칙을 나중에`,
          ver: `Spring Security`,
          why: `주소 규칙은 위에서부터 차례로 검사해 처음 맞는 것을 적용합니다. 넓은 규칙이 위에 있으면 아래의 좁은 규칙은 영영 적용되지 않습니다.`,
          bad: String.raw`
http.authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/**").authenticated()
        .requestMatchers("/api/admin/**").hasRole("ADMIN")   // 위 규칙에 먼저 걸려 여기까지 오지 않음
        .anyRequest().denyAll());
`,
          good: String.raw`
http.authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/admin/**").hasRole("ADMIN")   // 좁은 규칙을 먼저
        .requestMatchers("/api/**").authenticated()          // 넓은 규칙을 나중에
        .anyRequest().denyAll());
`,
        },
        {
          id: 'l4', short: `@PreAuthorize`,
          title: `권한 검사는 애너테이션으로 선언`,
          ver: `Spring Security`,
          why: `메서드마다 권한을 확인하는 if를 복사하면 하나쯤은 빠뜨립니다. 메서드 위에 선언해 두면 스프링이 실행 전에 검사합니다.`,
          bad: String.raw`
@DeleteMapping("/users/{id}")
public void delete(@PathVariable long id, Authentication auth) {
    boolean admin = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    if (!admin) throw new AccessDeniedException("권한 없음");   // 메서드마다 같은 검사를 복사
    userService.delete(id);
}
`,
          good: String.raw`
@Configuration
@EnableMethodSecurity
class SecurityConfig { }

@PreAuthorize("hasRole('ADMIN')")
@DeleteMapping("/users/{id}")
public void delete(@PathVariable long id) {
    userService.delete(id);
}

@PreAuthorize("#id == authentication.principal.id")   // 본인만
@GetMapping("/users/{id}/orders")
public List<OrderResponse> orders(@PathVariable long id) { ... }
`,
        },
        {
          id: 'l5', short: `CSRF`,
          title: `CSRF 보호를 이유 없이 끄지 않기`,
          ver: `Spring Security`,
          why: `브라우저는 쿠키를 자동으로 붙여 보내므로, 다른 사이트에 심은 폼이 로그인한 사용자 몰래 요청을 보낼 수 있습니다. 세션 쿠키로 인증한다면 CSRF 보호가 필요합니다.`,
          bad: String.raw`
// 세션 쿠키로 로그인하는 사이트인데, 검색해서 나온 설정을 그대로 붙여 넣음
http.csrf(csrf -> csrf.disable());
`,
          good: String.raw`
// 세션 쿠키 방식 : 켜 둔다 (기본값)
http.csrf(Customizer.withDefaults());

// Authorization 헤더에 토큰을 담는 API만 끈다
http.csrf(csrf -> csrf.disable())
    .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
`,
        },
        {
          id: 'l6', short: `JWT`,
          title: `JWT에는 식별자만, 만료 시간은 짧게`,
          ver: `jjwt 0.12`,
          why: `JWT의 내용은 암호화된 것이 아니라 누구나 풀어 볼 수 있습니다. 그리고 만료 시간이 없으면 한 번 탈취된 토큰이 영원히 통합니다.`,
          bad: String.raw`
String token = Jwts.builder()
        .subject(user.getEmail())
        .claim("password", user.getPassword())   // 누구나 읽을 수 있는 곳에 비밀번호
        .signWith(Keys.hmacShaKeyFor("secret1234secret1234secret1234ab".getBytes()))   // 키가 코드에
        .compact();                              // 만료 시간 없음
`,
          good: String.raw`
String token = Jwts.builder()
        .subject(String.valueOf(user.getId()))   // 식별자만 담는다
        .claim("role", user.getRole())
        .expiration(Date.from(Instant.now().plus(30, ChronoUnit.MINUTES)))
        .signWith(secretKey)                     // 키는 환경 변수에서 읽어 만든다
        .compact();
`,
        },
        {
          id: 'l7', short: `로그인 사용자`,
          title: `"누구인지"는 요청 값이 아니라 로그인 정보에서`,
          ver: `Spring Security`,
          why: `요청이 알려 준 사용자 번호를 믿으면 숫자만 바꿔 남의 데이터를 볼 수 있습니다. 누구인지는 서버가 인증한 정보에서만 꺼냅니다.`,
          bad: String.raw`
@GetMapping("/my/orders")
public List<OrderResponse> myOrders(@RequestParam long userId) {   // 요청이 알려 준 번호를 믿음
    return orderService.findByUser(userId);
}
`,
          good: String.raw`
@GetMapping("/my/orders")
public List<OrderResponse> myOrders(@AuthenticationPrincipal LoginUser user) {
    return orderService.findByUser(user.getId());   // 로그인 정보에서 꺼낸 번호만 믿는다
}
`,
        },
        {
          id: 'l8', short: `CORS`,
          title: `CORS는 우리 프런트 주소만 허용`,
          ver: `Spring Web`,
          why: `모든 출처를 허용하면 아무 사이트의 자바스크립트가 우리 API를 호출할 수 있습니다. 실제로 호출하는 프런트 주소만 적습니다.`,
          bad: String.raw`
config.setAllowedOrigins(List.of("*"));   // 어느 사이트에서든 호출 가능
config.setAllowedMethods(List.of("*"));
config.setAllowedHeaders(List.of("*"));
`,
          good: String.raw`
CorsConfiguration config = new CorsConfiguration();
config.setAllowedOrigins(List.of("https://shop.example.com"));
config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
config.setAllowCredentials(true);
`,
        },
        {
          id: 'l9', short: `시도 제한`,
          title: `로그인 시도 횟수 제한하기`,
          why: `횟수 제한이 없으면 흔한 비밀번호 목록을 차례로 넣어 보는 공격을 막을 수 없습니다. 실패 메시지도 이메일과 비밀번호 중 무엇이 틀렸는지 알려 주지 않게 합니다.`,
          bad: String.raw`
public Token login(String email, String password) {
    User user = userRepository.findByEmail(email).orElseThrow();
    if (!encoder.matches(password, user.getPasswordHash())) {
        throw new BadCredentialsException("비밀번호가 틀렸습니다");   // 몇 번이든 다시 시도 가능
    }
    return issueToken(user);
}
`,
          good: String.raw`
public Token login(String email, String password) {
    if (loginAttempts.isLocked(email)) {
        throw new LockedException("잠시 후 다시 시도해 주세요");   // 5번 틀리면 10분 잠금
    }
    User user = userRepository.findByEmail(email).orElse(null);
    if (user == null || !encoder.matches(password, user.getPasswordHash())) {
        loginAttempts.recordFailure(email);
        throw new BadCredentialsException("이메일 또는 비밀번호가 틀렸습니다");
    }
    loginAttempts.reset(email);
    return issueToken(user);
}
`,
        },
        {
          id: 'l10', short: `쿠키 속성`,
          title: `인증 쿠키에는 보안 속성 붙이기`,
          ver: `Spring Web`,
          why: `속성 없이 만든 쿠키는 자바스크립트로 읽을 수 있고, 암호화되지 않은 연결로도 전송되며, 다른 사이트에서 보낸 요청에도 따라갑니다.`,
          bad: String.raw`
Cookie cookie = new Cookie("refreshToken", token);
response.addCookie(cookie);
`,
          good: String.raw`
ResponseCookie cookie = ResponseCookie.from("refreshToken", token)
        .httpOnly(true)     // 자바스크립트에서 읽지 못함
        .secure(true)       // HTTPS에서만 전송
        .sameSite("Lax")    // 다른 사이트에서 온 요청에는 붙지 않음
        .path("/")
        .maxAge(Duration.ofDays(14))
        .build();

response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
`,
        },
      ],
    },
    {
      id: 'java-32', no: 32, name: `캐시와 Redis`,
      lead: `캐시는 가장 쉬운 성능 개선이지만 "옛 값이 보인다"는 새 문제를 만듭니다. 언제 넣고 언제 지울지, 그리고 Redis를 쓸 때 조심할 명령들을 다룹니다.`,
      lessons: [
        {
          id: 'l1', short: `@Cacheable`,
          title: `자주 읽고 드물게 바뀌는 값은 캐시`,
          ver: `Spring Cache`,
          why: `같은 값을 초당 수백 번 DB에서 읽을 필요는 없습니다. 메서드에 선언만 해 두면 처음 한 번만 실행하고 그 뒤로는 저장해 둔 값을 돌려줍니다.`,
          bad: String.raw`
public Product find(long id) {
    return productRepository.findById(id).orElseThrow();   // 초당 1000번 조회해도 매번 DB
}
`,
          good: String.raw`
@Configuration
@EnableCaching   // 설정 클래스에 한 번
class CacheConfig { }

@Cacheable(cacheNames = "products", key = "#id")
public Product find(long id) {
    return productRepository.findById(id).orElseThrow();   // 캐시에 없을 때만 실행된다
}
`,
        },
        {
          id: 'l2', short: `@CacheEvict`,
          title: `값을 바꾸면 캐시도 지우기`,
          ver: `Spring Cache`,
          why: `DB만 바꾸고 캐시를 그대로 두면 사용자는 계속 옛 값을 봅니다. 값을 바꾸는 메서드에서 해당 캐시를 함께 지웁니다.`,
          bad: String.raw`
@Cacheable(cacheNames = "products", key = "#id")
public Product find(long id) { ... }

public void changePrice(long id, long price) {
    productRepository.updatePrice(id, price);   // 캐시는 옛 가격을 계속 돌려줌
}
`,
          good: String.raw`
@CacheEvict(cacheNames = "products", key = "#id")
public void changePrice(long id, long price) {
    productRepository.updatePrice(id, price);
}
`,
        },
        {
          id: 'l3', short: `만료 시간`,
          title: `캐시에는 항상 만료 시간`,
          ver: `Spring Data Redis`,
          why: `지우는 코드를 한 곳이라도 빠뜨리면 옛 값이 영원히 남습니다. 만료 시간이 있으면 실수가 있어도 그 시간 뒤에는 바로잡힙니다.`,
          bad: String.raw`
@Bean
RedisCacheManager cacheManager(RedisConnectionFactory factory) {
    return RedisCacheManager.create(factory);   // 만료 시간 없음
}
`,
          good: String.raw`
@Bean
RedisCacheManager cacheManager(RedisConnectionFactory factory) {
    RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(10));   // 길어도 10분 뒤에는 새 값
    return RedisCacheManager.builder(factory).cacheDefaults(config).build();
}
`,
        },
        {
          id: 'l4', short: `캐시 키`,
          title: `결과를 바꾸는 값은 모두 키에 넣기`,
          ver: `Spring Cache`,
          why: `결과에 영향을 주는 매개변수가 키에서 빠지면 서로 다른 요청이 같은 캐시를 받습니다.`,
          bad: String.raw`
@Cacheable(cacheNames = "orders", key = "#userId")   // page가 키에 없음
public List<Order> find(long userId, int page) { ... }
// 2쪽을 요청해도 캐시에 있던 1쪽이 나온다
`,
          good: String.raw`
@Cacheable(cacheNames = "orders", key = "#userId + ':' + #page")
public List<Order> find(long userId, int page) { ... }
`,
          note: `key를 생략하면 <strong>모든 매개변수로 키를 만듭니다.</strong> 직접 적을 때만 빠진 것이 없는지 확인하면 됩니다.`,
        },
        {
          id: 'l5', short: `동시 만료`,
          title: `만료 순간의 요청 폭주 막기`,
          ver: `Spring Cache`,
          why: `무거운 쿼리의 캐시가 만료되는 순간, 그때 들어온 요청들이 모두 캐시가 없다고 보고 같은 쿼리를 동시에 실행합니다. 하나만 계산하고 나머지는 기다리게 합니다.`,
          bad: String.raw`
@Cacheable(cacheNames = "ranking")
public List<Product> topSellers() {
    return productRepository.findTopSellers();   // 3초 걸리는 쿼리
}
// 만료되는 순간 들어온 요청 500개가 전부 이 쿼리를 실행
`,
          good: String.raw`
@Cacheable(cacheNames = "ranking", sync = true)   // 한 요청만 계산하고 나머지는 기다린다
public List<Product> topSellers() {
    return productRepository.findTopSellers();
}
`,
          note: `sync는 <strong>한 서버 안에서만</strong> 통합니다. 서버가 여러 대면 만료되기 전에 미리 갱신하는 방식을 함께 씁니다.`,
        },
        {
          id: 'l6', short: `없는 값`,
          title: `"없음"도 캐시하기`,
          ver: `Spring Cache`,
          why: `없는 번호로 반복해서 요청하면 캐시에 남는 것이 없어 매번 DB까지 갑니다. 일부러 없는 번호를 대량으로 보내는 공격에 그대로 노출됩니다.`,
          bad: String.raw`
@Cacheable(cacheNames = "products", key = "#id", unless = "#result == null")
public Product find(long id) {
    return productRepository.findById(id).orElse(null);
}
// 없는 번호는 캐시되지 않아 매번 DB를 조회
`,
          good: String.raw`
@Cacheable(cacheNames = "products", key = "#id")
public Optional<Product> find(long id) {
    return productRepository.findById(id);   // "없음"도 캐시된다
}
`,
        },
        {
          id: 'l7', short: `KEYS`,
          title: `운영 Redis에서 KEYS를 쓰지 않기`,
          ver: `Redis`,
          lang: 'plain',
          why: `Redis는 한 번에 명령 하나만 처리합니다. KEYS는 모든 키를 한 번에 훑으므로 키가 많으면 그동안 다른 요청이 전부 멈춥니다.`,
          bad: String.raw`
KEYS session:*
# 키 전체를 한 번에 훑는 동안 모든 요청이 멈춘다
`,
          good: String.raw`
SCAN 0 MATCH session:* COUNT 100
# 조금씩 나눠 훑는다. 돌려받은 커서로 다음 구간을 이어서 요청한다

// Spring Data Redis
ScanOptions options = ScanOptions.scanOptions().match("session:*").count(100).build();
try (Cursor<String> cursor = redisTemplate.scan(options)) {
    cursor.forEachRemaining(this::handle);
}
`,
        },
        {
          id: 'l8', short: `큰 값`,
          title: `키 하나에 큰 덩어리를 넣지 않기`,
          ver: `Spring Data Redis`,
          why: `수 MB짜리 값은 읽고 쓸 때마다 통째로 오가서 Redis와 네트워크를 붙잡습니다. 필드별로 나눠 두고 필요한 것만 읽습니다.`,
          bad: String.raw`
// 회원의 모든 정보를 JSON 하나로 저장 : 수 MB
redisTemplate.opsForValue().set("user:1", hugeJson);

String json = redisTemplate.opsForValue().get("user:1");   // 닉네임 하나 보려고 전체를 가져옴
`,
          good: String.raw`
redisTemplate.opsForHash().put("user:1", "nickname", "kim");
redisTemplate.opsForHash().put("user:1", "grade", "VIP");

Object nickname = redisTemplate.opsForHash().get("user:1", "nickname");   // 필요한 필드만
`,
        },
        {
          id: 'l9', short: `분산 락`,
          title: `락에는 만료 시간을, 해제는 내 것만`,
          ver: `Spring Data Redis`,
          why: `만료 시간 없이 건 락은 서버가 죽으면 영원히 남습니다. 그리고 다른 서버가 건 락을 내가 지우면 안 되므로 누구의 락인지 값으로 구분합니다.`,
          bad: String.raw`
Boolean locked = redisTemplate.opsForValue().setIfAbsent("lock:coupon", "1");
if (Boolean.TRUE.equals(locked)) {
    issueCoupon();                          // 여기서 서버가 죽으면 락이 영원히 남음
    redisTemplate.delete("lock:coupon");
}
`,
          good: String.raw`
String owner = UUID.randomUUID().toString();
Boolean locked = redisTemplate.opsForValue()
        .setIfAbsent("lock:coupon", owner, Duration.ofSeconds(10));   // 만료 시간과 함께

if (Boolean.TRUE.equals(locked)) {
    try {
        issueCoupon();
    } finally {
        if (owner.equals(redisTemplate.opsForValue().get("lock:coupon"))) {
            redisTemplate.delete("lock:coupon");   // 내가 건 락일 때만 푼다
        }
    }
}
`,
          note: `확인과 삭제 사이에도 틈이 있습니다. 실무에서는 이 과정을 안전하게 처리해 주는 <strong>Redisson</strong> 같은 라이브러리를 씁니다.`,
        },
        {
          id: 'l10', short: `원본은 DB`,
          title: `캐시가 죽어도 서비스는 살아 있게`,
          ver: `Spring Data Redis`,
          why: `캐시는 빠르게 하려고 쓰는 것이지 원본이 아닙니다. Redis가 잠깐 끊겼을 때 조회 전체가 실패한다면 캐시가 오히려 장애 지점이 된 것입니다.`,
          bad: String.raw`
public Product find(long id) {
    return (Product) redisTemplate.opsForValue().get("product:" + id);
}
// Redis가 끊기면 상품 조회 전체가 실패
`,
          good: String.raw`
public Product find(long id) {
    try {
        Product cached = (Product) redisTemplate.opsForValue().get("product:" + id);
        if (cached != null) return cached;
    } catch (RedisConnectionFailureException e) {
        log.warn("캐시 조회 실패, DB에서 대신 조회 id={}", id);
    }
    return productRepository.findById(id).orElseThrow();   // 원본은 항상 DB
}
`,
        },
      ],
    },
    {
      id: 'java-33', no: 33, name: `메시지 큐`,
      lead: `서비스끼리 직접 부르는 대신 메시지로 알리는 방식입니다. 느슨해지는 대신 "두 번 올 수 있고, 순서가 바뀔 수 있고, 사라질 수 있다"는 새 문제를 다뤄야 합니다. 예시는 카프카 기준입니다.`,
      lessons: [
        {
          id: 'l1', short: `이벤트 발행`,
          title: `후속 작업은 직접 부르지 말고 알리기`,
          ver: `Spring Kafka`,
          why: `주문이 메일, 포인트, 통계 서버를 차례로 부르면 그중 하나만 느리거나 죽어도 주문이 실패합니다. "주문됐다"는 사실만 알리고 각자 받아 처리하게 합니다.`,
          bad: String.raw`
@Transactional
public void place(Order order) {
    orderRepository.save(order);
    mailClient.sendReceipt(order);   // 메일 서버가 느리면 주문도 느려짐
    pointClient.addPoint(order);     // 포인트 서버가 죽으면 주문도 실패
    statsClient.record(order);
}
`,
          good: String.raw`
public void place(Order order) {
    orderRepository.save(order);
    kafkaTemplate.send("order.placed", String.valueOf(order.getId()), OrderPlaced.from(order));
}

@KafkaListener(topics = "order.placed", groupId = "mail")
public void sendReceipt(OrderPlaced event) { ... }   // 메일, 포인트, 통계가 각자 받는다
`,
        },
        {
          id: 'l2', short: `중복 처리`,
          title: `같은 메시지가 두 번 와도 괜찮게`,
          ver: `Spring Kafka`,
          why: `메시지 큐는 "적어도 한 번" 전달이 기본이라 같은 메시지가 다시 올 수 있습니다. 이미 처리한 것인지 확인하지 않으면 포인트가 두 번 쌓이고 메일이 두 번 갑니다.`,
          bad: String.raw`
@KafkaListener(topics = "order.placed", groupId = "point")
public void addPoint(OrderPlaced event) {
    pointService.add(event.userId(), event.amount() / 100);
}   // 같은 메시지가 두 번 오면 포인트도 두 번 적립
`,
          good: String.raw`
@KafkaListener(topics = "order.placed", groupId = "point")
@Transactional
public void addPoint(OrderPlaced event) {
    if (processedEvents.existsById(event.eventId())) return;   // 이미 처리했으면 건너뛴다

    pointService.add(event.userId(), event.amount() / 100);
    processedEvents.save(new ProcessedEvent(event.eventId()));
}
`,
        },
        {
          id: 'l3', short: `커밋 후 발행`,
          title: `메시지는 DB 커밋이 끝난 뒤에 보내기`,
          ver: `Spring`,
          why: `트랜잭션 안에서 메시지를 보내면, 그 뒤에 예외가 나서 롤백돼도 메시지는 이미 나갔습니다. 존재하지 않는 주문의 이벤트가 돌아다니게 됩니다.`,
          bad: String.raw`
@Transactional
public void place(Order order) {
    orderRepository.save(order);
    kafkaTemplate.send("order.placed", OrderPlaced.from(order));   // 아직 커밋 전
    stockService.decrease(order);   // 여기서 예외 : 주문은 롤백, 이벤트는 이미 나감
}
`,
          good: String.raw`
@Transactional
public void place(Order order) {
    orderRepository.save(order);
    stockService.decrease(order);
    events.publishEvent(OrderPlaced.from(order));   // 스프링 내부 이벤트로 알려 두고
}

@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)   // 커밋이 끝난 뒤에만
public void publish(OrderPlaced event) {
    kafkaTemplate.send("order.placed", event);
}
`,
        },
        {
          id: 'l4', short: `아웃박스`,
          title: `반드시 나가야 하는 메시지는 DB에 먼저 기록`,
          why: `커밋 직후에 서버가 죽으면 주문은 저장됐는데 메시지는 영영 나가지 않습니다. 보낼 메시지를 같은 트랜잭션으로 테이블에 적어 두고, 따로 도는 작업이 꺼내 보냅니다.`,
          bad: String.raw`
@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
public void publish(OrderPlaced event) {
    kafkaTemplate.send("order.placed", event);
}   // 커밋 직후 서버가 죽으면 : 주문은 있는데 이벤트는 사라짐
`,
          good: String.raw`
@Transactional
public void place(Order order) {
    orderRepository.save(order);
    outboxRepository.save(Outbox.of("order.placed", OrderPlaced.from(order)));   // 같은 트랜잭션
}

@Scheduled(fixedDelay = 1000)
public void relay() {   // 아직 안 보낸 것을 찾아 보낸다
    for (Outbox row : outboxRepository.findUnsent(100)) {
        kafkaTemplate.send(row.topic(), row.payload());
        row.markSent();
    }
}
`,
          note: `보낸 직후에 죽으면 같은 메시지가 다시 나갑니다. 그래서 <strong>받는 쪽의 중복 처리(02번)</strong>가 함께 필요합니다.`,
        },
        {
          id: 'l5', short: `메시지 키`,
          title: `순서가 중요하면 같은 키로 보내기`,
          ver: `Kafka`,
          why: `키 없이 보내면 메시지가 여러 파티션에 흩어져 순서가 보장되지 않습니다. 같은 주문의 이벤트는 같은 키로 보내야 보낸 순서대로 처리됩니다.`,
          bad: String.raw`
kafkaTemplate.send("order.events", new OrderPaid(orderId));
kafkaTemplate.send("order.events", new OrderCanceled(orderId));
// 서로 다른 파티션으로 가면 "취소"가 "결제"보다 먼저 처리될 수 있음
`,
          good: String.raw`
String key = String.valueOf(orderId);
kafkaTemplate.send("order.events", key, new OrderPaid(orderId));
kafkaTemplate.send("order.events", key, new OrderCanceled(orderId));
// 같은 키는 같은 파티션으로 간다. 한 파티션 안에서는 순서가 지켜진다
`,
        },
        {
          id: 'l6', short: `실패 처리`,
          title: `실패한 메시지는 재시도하고, 안 되면 따로 모으기`,
          ver: `Spring Kafka`,
          why: `예외를 삼키고 넘어가면 그 메시지는 영영 처리되지 않습니다. 반대로 끝없이 재시도하면 뒤의 메시지가 모두 막힙니다. 몇 번 다시 해 보고 안 되면 실패 전용 토픽으로 옮깁니다.`,
          bad: String.raw`
@KafkaListener(topics = "order.placed")
public void handle(OrderPlaced event) {
    try {
        process(event);
    } catch (Exception e) {
        log.error("처리 실패", e);   // 삼키고 다음으로 : 이 메시지는 사라짐
    }
}
`,
          good: String.raw`
@Bean
DefaultErrorHandler errorHandler(KafkaTemplate<String, Object> template) {
    var recoverer = new DeadLetterPublishingRecoverer(template);            // 끝내 실패하면 실패 전용 토픽으로
    return new DefaultErrorHandler(recoverer, new FixedBackOff(1000L, 3));  // 1초 간격으로 3번 재시도
}

@KafkaListener(topics = "order.placed")
public void handle(OrderPlaced event) {
    process(event);   // 예외는 그대로 던진다
}
`,
        },
        {
          id: 'l7', short: `이벤트 형식`,
          title: `메시지의 모양은 약속으로 따로 정의`,
          why: `엔티티를 그대로 보내면 내부 필드를 바꿀 때마다 받는 쪽 서비스가 함께 깨집니다. 밖으로 내보내는 모양은 전용 타입으로 정하고 함부로 바꾸지 않습니다.`,
          bad: String.raw`
kafkaTemplate.send("order.placed", order);   // JPA 엔티티를 그대로 직렬화
// 엔티티의 필드를 바꾸면 받는 쪽 서비스들이 한꺼번에 깨짐
`,
          good: String.raw`
public record OrderPlaced(   // 밖으로 내보내는 약속
        String eventId,
        long orderId,
        long userId,
        long amount,
        Instant occurredAt) {}

// 필드는 추가만 한다. 있던 필드의 이름과 뜻은 바꾸지 않는다
`,
        },
        {
          id: 'l8', short: `큰 메시지`,
          title: `메시지에 파일을 싣지 않기`,
          ver: `Kafka`,
          why: `메시지 큐는 작은 메시지를 빠르게 나르도록 만들어졌습니다. 큰 파일은 저장소에 올리고 메시지에는 위치만 담습니다.`,
          bad: String.raw`
byte[] pdf = Files.readAllBytes(invoicePath);   // 5MB
kafkaTemplate.send("invoice.created", new InvoiceCreated(orderId, pdf));
// 기본 한도(약 1MB)를 넘어 전송 실패
`,
          good: String.raw`
String location = storage.upload(invoicePath);   // 파일은 저장소에
kafkaTemplate.send("invoice.created", new InvoiceCreated(orderId, location));   // 메시지에는 위치만
`,
        },
        {
          id: 'l9', short: `읽음 기록`,
          title: `처리를 끝낸 뒤에 읽었다고 기록`,
          ver: `Spring Kafka`,
          lang: 'plain',
          why: `일정 시간마다 자동으로 "여기까지 읽었다"고 기록하면, 처리 도중 서버가 죽었을 때 읽었다고 기록됐지만 처리는 안 된 메시지가 사라집니다.`,
          bad: String.raw`
# application.yml
spring.kafka.consumer.enable-auto-commit: true
# 처리가 끝났는지와 상관없이 일정 시간마다 기록한다
`,
          good: String.raw`
# application.yml
spring.kafka.consumer.enable-auto-commit: false
spring.kafka.listener.ack-mode: record    # 리스너가 한 건을 끝낼 때마다 기록

# 처리 도중 죽으면 그 메시지부터 다시 받는다
`,
        },
        {
          id: 'l10', short: `느린 처리`,
          title: `리스너 안에서 오래 걸리는 일을 하지 않기`,
          ver: `Spring Kafka`,
          why: `컨슈머가 정해진 시간 안에 다음 메시지를 가져가지 않으면 죽은 것으로 보고 내보냅니다. 그 메시지는 다른 컨슈머에게 다시 가고 같은 일이 반복됩니다.`,
          bad: String.raw`
@KafkaListener(topics = "report.requested")
public void handle(ReportRequested event) {
    reportService.generate(event);   // 한 건에 10분
}
`,
          good: String.raw`
@KafkaListener(topics = "report.requested")
public void handle(ReportRequested event) {
    jobRepository.save(ReportJob.requested(event));   // 받은 것은 기록만 하고 바로 끝낸다
}
// 오래 걸리는 작업은 별도 작업자가 기록을 보고 처리한다
`,
          note: `조금 느린 정도라면 한 번에 가져오는 건수를 정하는 <strong>max.poll.records</strong>를 줄이는 것으로 충분할 수 있습니다.`,
        },
      ],
    },
    {
      id: 'java-34', no: 34, name: `도커와 배포`,
      lead: `만든 서비스를 컨테이너에 담아 내보낼 때의 습관입니다. 이미지를 작고 안전하게 만들고, 배포하는 동안 요청이 끊기지 않게 하는 것이 중심입니다.`,
      lessons: [
        {
          id: 'l1', short: `이미지 태그`,
          title: `베이스 이미지는 버전을 적기`,
          ver: `Docker`,
          lang: 'plain',
          why: `latest는 받는 날에 따라 다른 버전이 됩니다. 26회차 01번과 같은 이유로, 어제 되던 빌드가 오늘 달라집니다.`,
          bad: String.raw`
FROM openjdk:latest
# 받을 때마다 다른 버전일 수 있고, 이 이미지는 더 이상 관리되지도 않는다
`,
          good: String.raw`
FROM eclipse-temurin:21-jre
# 버전을 적는다. 실행에는 JDK가 아니라 JRE면 충분하다
`,
        },
        {
          id: 'l2', short: `멀티 스테이지`,
          title: `빌드와 실행을 나눠 이미지를 작게`,
          ver: `Docker`,
          lang: 'plain',
          why: `한 단계로 만들면 소스 코드와 빌드 도구, 내려받은 의존성 캐시까지 배포 이미지에 들어갑니다. 빌드한 결과물만 실행용 이미지로 옮깁니다.`,
          bad: String.raw`
FROM eclipse-temurin:21-jdk
COPY . /app
WORKDIR /app
RUN ./gradlew bootJar
CMD ["java", "-jar", "build/libs/app.jar"]
# 소스, Gradle 캐시, JDK까지 전부 든 큰 이미지가 배포된다
`,
          good: String.raw`
# 1단계 : 빌드
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY . .
RUN ./gradlew bootJar

# 2단계 : 실행에 필요한 것만
FROM eclipse-temurin:21-jre
COPY --from=build /app/build/libs/app.jar /app.jar
ENTRYPOINT ["java", "-jar", "/app.jar"]
`,
        },
        {
          id: 'l3', short: `USER`,
          title: `컨테이너를 root로 실행하지 않기`,
          ver: `Docker`,
          lang: 'plain',
          why: `따로 지정하지 않으면 컨테이너 안의 프로세스는 root로 실행됩니다. 애플리케이션이 뚫렸을 때 공격자가 할 수 있는 일이 훨씬 많아집니다.`,
          bad: String.raw`
FROM eclipse-temurin:21-jre
COPY app.jar /app.jar
ENTRYPOINT ["java", "-jar", "/app.jar"]
# 사용자를 지정하지 않으면 root로 실행된다
`,
          good: String.raw`
FROM eclipse-temurin:21-jre
RUN useradd --system --no-create-home app
COPY app.jar /app.jar
USER app
ENTRYPOINT ["java", "-jar", "/app.jar"]
`,
        },
        {
          id: 'l4', short: `레이어 캐시`,
          title: `자주 바뀌는 것을 나중에 복사`,
          ver: `Docker`,
          lang: 'plain',
          why: `도커는 줄마다 결과를 저장해 두고, 바뀐 줄부터만 다시 실행합니다. 전체를 한 번에 복사하면 소스 한 줄만 바꿔도 의존성을 처음부터 다시 받습니다.`,
          bad: String.raw`
COPY . .
RUN ./gradlew bootJar
# 소스 한 줄만 바꿔도 의존성을 처음부터 다시 내려받는다
`,
          good: String.raw`
COPY gradlew settings.gradle.kts build.gradle.kts ./
COPY gradle ./gradle
RUN ./gradlew dependencies    # 빌드 파일이 안 바뀌면 저장해 둔 결과를 쓴다

COPY src ./src
RUN ./gradlew bootJar         # 소스가 바뀌면 여기부터만 다시 실행
`,
        },
        {
          id: 'l5', short: `환경 변수`,
          title: `설정과 비밀 값을 이미지에 넣지 않기`,
          ver: `Docker`,
          lang: 'plain',
          why: `이미지에 넣은 값은 이미지를 받은 사람이면 누구나 꺼내 볼 수 있습니다. 또 환경마다 이미지를 따로 만들어야 해서, 테스트한 것과 다른 이미지가 운영에 나갑니다.`,
          bad: String.raw`
COPY application-prod.yml /config/application-prod.yml
ENV DB_PASSWORD=실제-운영-비밀번호
`,
          good: String.raw`
# 이미지에는 넣지 않는다. 실행할 때 밖에서 넣어 준다
docker run -e SPRING_PROFILES_ACTIVE=prod -e DB_PASSWORD shop-api:1.4.2

# 같은 이미지를 개발, 스테이징, 운영에서 그대로 쓴다
`,
        },
        {
          id: 'l6', short: `메모리`,
          title: `힙 크기는 컨테이너 한도에 비례하게`,
          ver: `JVM`,
          lang: 'plain',
          why: `힙을 고정 값으로 주면 컨테이너 한도와 어긋나기 쉽습니다. 한도를 넘는 순간 컨테이너가 강제로 종료됩니다. 비율로 주면 한도를 바꿔도 따라갑니다.`,
          bad: String.raw`
ENTRYPOINT ["java", "-Xmx4g", "-jar", "/app.jar"]
# 컨테이너 한도는 2GB인데 힙을 4GB까지 쓰려 함 : 강제 종료(OOMKilled)
`,
          good: String.raw`
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app.jar"]
# 컨테이너 메모리의 75%를 힙으로 쓴다
# 나머지는 스레드 스택 같은 힙 밖 메모리의 몫으로 남긴다
`,
        },
        {
          id: 'l7', short: `준비 확인`,
          title: `준비가 끝난 뒤에 요청 받기`,
          ver: `Kubernetes`,
          lang: 'plain',
          why: `프로세스가 떴다고 요청을 처리할 수 있는 것은 아닙니다. 스프링이 준비되기 전에 요청이 들어오면 배포할 때마다 오류가 납니다.`,
          bad: String.raw`
containers:
  - name: shop-api
    image: shop-api:1.4.2
# 프로세스가 뜨자마자 요청을 보낸다
`,
          good: String.raw`
containers:
  - name: shop-api
    image: shop-api:1.4.2
    readinessProbe:      # 준비됐을 때만 요청을 받는다
      httpGet: { path: /actuator/health/readiness, port: 8080 }
    livenessProbe:       # 응답이 없으면 다시 시작한다
      httpGet: { path: /actuator/health/liveness, port: 8080 }
      initialDelaySeconds: 30
`,
        },
        {
          id: 'l8', short: `우아한 종료`,
          title: `하던 요청은 끝내고 종료`,
          ver: `Spring Boot`,
          lang: 'plain',
          why: `종료 신호를 받는 즉시 내려가면 처리 중이던 요청이 끊깁니다. 새 요청은 받지 않되 하던 요청은 마칠 시간을 줍니다.`,
          bad: String.raw`
# 기본 설정 : 종료 신호를 받으면 바로 내려간다
# 배포할 때마다 처리 중이던 요청이 끊겨 오류가 난다
`,
          good: String.raw`
# application.yml
server.shutdown: graceful
spring.lifecycle.timeout-per-shutdown-phase: 30s    # 최대 30초까지 기다린다

# Dockerfile : 종료 신호가 자바에 직접 전달되도록 배열 형태로 쓴다
ENTRYPOINT ["java", "-jar", "/app.jar"]
`,
        },
        {
          id: 'l9', short: `로그 출력`,
          title: `컨테이너에서는 로그를 표준 출력으로`,
          ver: `Docker`,
          lang: 'plain',
          why: `컨테이너 안의 파일은 컨테이너가 교체될 때 함께 사라집니다. 표준 출력으로 내보내면 플랫폼이 모아서 보관합니다.`,
          bad: String.raw`
<!-- 컨테이너 안의 파일에 기록 -->
<file>/var/log/app/app.log</file>
<!-- 컨테이너가 교체되면 장애 직전의 로그도 함께 사라진다 -->
`,
          good: String.raw`
<appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">

# 수집과 보관은 플랫폼이 한다
docker logs shop-api
kubectl logs deploy/shop-api
`,
          note: `25회차 10번의 파일 나누기는 서버에 직접 설치해 돌릴 때의 방법입니다. <strong>컨테이너에서는 표준 출력이 기본</strong>입니다.`,
        },
        {
          id: 'l10', short: `.dockerignore`,
          title: `이미지에 넣지 않을 파일 정하기`,
          ver: `Docker`,
          lang: 'plain',
          why: `전체를 복사하면 깃 기록, 빌드 결과물, 비밀 값이 든 파일까지 이미지에 들어갑니다. 이미지가 커지고 비밀 값이 함께 배포됩니다.`,
          bad: String.raw`
COPY . .
# .git, build, .env, IDE 설정까지 전부 이미지에 들어간다
`,
          good: String.raw`
# .dockerignore
.git
.gradle
build
.idea
.env
*.md
`,
        },
      ],
    },
    {
      id: 'java-35', no: 35, name: `성능 튜닝`,
      lead: `20회차 10번에서 "추측하지 말고 측정하라"고 했습니다. 여기서는 측정했을 때 실제로 가장 자주 원인으로 나오는 것들을 다룹니다. 대부분 자바 코드가 아니라 DB와 기다림에 있습니다.`,
      lessons: [
        {
          id: 'l1', short: `인덱스`,
          title: `느린 쿼리는 실행 계획부터 보기`,
          ver: `SQL`,
          lang: 'plain',
          why: `조건에 쓰는 컬럼에 인덱스가 없으면 테이블 전체를 읽습니다. 데이터가 적을 때는 티가 안 나다가 늘어난 뒤에 갑자기 느려집니다.`,
          bad: String.raw`
SELECT * FROM orders WHERE member_id = 1024;

EXPLAIN SELECT * FROM orders WHERE member_id = 1024;
-- type: ALL, rows: 5000000    주문 500만 건을 처음부터 끝까지 읽는다
`,
          good: String.raw`
CREATE INDEX idx_orders_member ON orders (member_id);

EXPLAIN SELECT * FROM orders WHERE member_id = 1024;
-- type: ref, rows: 12         필요한 12건만 읽는다
`,
        },
        {
          id: 'l2', short: `인덱스를 못 쓰는 조건`,
          title: `인덱스가 있어도 못 쓰게 만드는 조건 피하기`,
          ver: `SQL`,
          lang: 'plain',
          why: `컬럼을 함수로 감싸거나, 앞이 열린 LIKE를 쓰거나, 타입이 다른 값과 비교하면 인덱스가 있어도 전체를 훑습니다. 컬럼은 그대로 두고 비교하는 값 쪽을 맞춥니다.`,
          bad: String.raw`
SELECT * FROM orders WHERE DATE(created_at) = '2026-11-11';   -- 컬럼을 함수로 감쌈
SELECT * FROM members WHERE name LIKE '%철수';                 -- 앞이 열린 검색
SELECT * FROM members WHERE phone = 01012345678;               -- 문자 컬럼을 숫자와 비교
`,
          good: String.raw`
SELECT * FROM orders
WHERE created_at >= '2026-11-11' AND created_at < '2026-11-12';   -- 컬럼은 그대로, 범위로

SELECT * FROM members WHERE name LIKE '김%';                       -- 앞이 정해진 검색
SELECT * FROM members WHERE phone = '01012345678';                 -- 타입을 맞춘다
`,
        },
        {
          id: 'l3', short: `필요한 컬럼만`,
          title: `목록에는 필요한 컬럼만 읽기`,
          ver: `Spring Data JPA`,
          why: `목록 화면에 제목만 보이는데 본문까지 전부 읽으면 DB, 네트워크, 메모리를 모두 낭비합니다. 화면에 필요한 값만 담은 타입으로 조회합니다.`,
          bad: String.raw`
// 목록에는 제목과 날짜만 필요한데 본문(수십 KB)까지 전부 읽는다
List<Post> posts = postRepository.findAll(pageable).getContent();
`,
          good: String.raw`
public record PostSummary(Long id, String title, LocalDateTime createdAt) {}

@Query("select new com.shop.post.PostSummary(p.id, p.title, p.createdAt) from Post p")
Page<PostSummary> findSummaries(Pageable pageable);   // 필요한 컬럼만 조회한다
`,
        },
        {
          id: 'l4', short: `풀 크기`,
          title: `커넥션 풀을 무작정 키우지 않기`,
          ver: `HikariCP`,
          lang: 'plain',
          why: `DB가 동시에 처리할 수 있는 쿼리 수는 정해져 있습니다. 커넥션을 수백 개로 늘리면 DB 안에서 서로 기다리느라 오히려 느려집니다.`,
          bad: String.raw`
# "느리니까 커넥션을 늘리자"
spring.datasource.hikari.maximum-pool-size: 500
`,
          good: String.raw`
spring.datasource.hikari.maximum-pool-size: 20
spring.datasource.hikari.connection-timeout: 3000    # 못 빌리면 3초 안에 실패

# 풀이 모자란다면 늘리기 전에, 커넥션을 오래 쥐고 있는 코드부터 찾는다 (21회차 08번)
`,
        },
        {
          id: 'l5', short: `반복문 밖으로`,
          title: `변하지 않는 조회는 반복문 밖에서`,
          why: `반복할 때마다 같은 값을 다시 조회하면 건수만큼 DB를 왕복합니다. 눈에 잘 띄지 않아서 프로파일러로 재 보면 가장 자주 나오는 낭비입니다.`,
          bad: String.raw`
for (Order order : orders) {
    double rate = policyRepository.findDiscountRate();   // 모든 주문에 같은 값인데 매번 조회
    order.applyDiscount(rate);
}
`,
          good: String.raw`
double rate = policyRepository.findDiscountRate();   // 한 번만
for (Order order : orders) {
    order.applyDiscount(rate);
}
`,
        },
        {
          id: 'l6', short: `뒤로 미루기`,
          title: `응답에 필요 없는 일은 응답 뒤로`,
          ver: `Spring`,
          why: `메일 발송이나 통계 기록은 사용자가 기다릴 이유가 없습니다. 응답에 꼭 필요한 일만 하고 나머지는 다른 스레드로 넘깁니다.`,
          bad: String.raw`
public OrderResponse place(OrderRequest request) {
    Order order = orderService.create(request);
    mailService.sendReceipt(order);     // 2초
    statsService.record(order);         // 1초
    return OrderResponse.from(order);   // 사용자는 3초를 더 기다린다
}
`,
          good: String.raw`
public OrderResponse place(OrderRequest request) {
    Order order = orderService.create(request);
    events.publishEvent(new OrderPlaced(order.getId()));   // 응답에 필요 없는 일은 미룬다
    return OrderResponse.from(order);
}

@Async
@TransactionalEventListener
public void onOrderPlaced(OrderPlaced event) { ... }   // 다른 스레드에서 처리
`,
          note: `@Async는 설정 클래스에 <strong>@EnableAsync</strong>가 있어야 동작합니다. 전용 스레드 풀도 함께 정해 둡니다.`,
        },
        {
          id: 'l7', short: `응답 압축`,
          title: `큰 응답은 압축해서 보내기`,
          ver: `Spring Boot`,
          lang: 'plain',
          why: `서버가 빨리 만들어도 내려받는 데 오래 걸리면 사용자에게는 느린 서비스입니다. JSON은 압축이 잘 되어 설정 하나로 크기가 크게 줄어듭니다.`,
          bad: String.raw`
# 상품 목록 JSON 800KB를 그대로 내려보낸다
# 모바일 네트워크에서는 내려받는 데만 몇 초가 걸린다
`,
          good: String.raw`
# application.yml
server.compression.enabled: true
server.compression.min-response-size: 1024
server.compression.mime-types: application/json,text/html,text/css,application/javascript

# 그리고 화면에서 쓰지 않는 필드는 응답에서 뺀다
`,
        },
        {
          id: 'l8', short: `대기열 한도`,
          title: `스레드 풀의 대기열에 한도 두기`,
          why: `Executors로 만든 고정 크기 풀은 대기열에 제한이 없습니다. 처리보다 요청이 빨리 쌓이면 대기열이 끝없이 커지다 메모리가 바닥납니다.`,
          bad: String.raw`
ExecutorService pool = Executors.newFixedThreadPool(10);
// 대기열 크기에 제한이 없다 : 밀리기 시작하면 OutOfMemoryError까지 쌓인다
`,
          good: String.raw`
ExecutorService pool = new ThreadPoolExecutor(
        10, 10, 0L, TimeUnit.MILLISECONDS,
        new ArrayBlockingQueue<>(1000),                 // 대기열에 한도를 둔다
        new ThreadPoolExecutor.CallerRunsPolicy());     // 가득 차면 요청한 쪽이 직접 처리한다
`,
          note: `CallerRunsPolicy는 요청을 보내는 쪽을 느리게 만들어 <strong>자연스럽게 속도를 줄여 줍니다.</strong> 버리거나 예외를 던지는 정책도 있습니다.`,
        },
        {
          id: 'l9', short: `GC 로그 · JFR`,
          title: `기록은 문제가 나기 전에 켜 두기`,
          ver: `JVM`,
          lang: 'plain',
          why: `"어제 새벽에 10초씩 멈췄다"는 문제는 다시 일어나지 않으면 원인을 찾을 수 없습니다. GC 로그와 JFR을 항상 켜 두면 지나간 일을 되짚어 볼 수 있습니다.`,
          bad: String.raw`
java -jar app.jar
# 응답이 멈췄던 시각의 기록이 아무것도 없다
`,
          good: String.raw`
# 실행 옵션에 추가한다
-Xlog:gc*:file=logs/gc.log:time,uptime:filecount=5,filesize=20m
-XX:StartFlightRecording=maxage=6h,disk=true

# gc.log   GC가 언제 얼마나 멈췄는지
# JFR      최근 6시간의 CPU, 메모리, 락, I/O 기록. 문제가 난 뒤에 꺼내 본다
`,
        },
        {
          id: 'l10', short: `부하 테스트`,
          title: `얼마나 버티는지 미리 재 보기`,
          ver: `k6`,
          lang: 'plain',
          why: `이벤트 당일에 처음으로 평소의 수십 배 트래픽을 맞으면 어디가 먼저 무너지는지 운영에서 알게 됩니다. 같은 조건으로 미리 부하를 걸어 한계를 확인합니다.`,
          bad: String.raw`
# 이벤트 당일, 평소의 20배 트래픽
# 얼마나 버티는지 아무도 모른 채 운영에서 처음 확인한다
`,
          good: String.raw`
k6 run --vus 500 --duration 5m order-test.js

# 목표를 숫자로 정해 두고 확인한다
#   응답 시간   100건 중 95건이 500ms 이하
#   오류율      0.1% 이하
#   처리량      초당 2000건 이상
`,
        },
      ],
    },
    {
      id: 'java-36', no: 36, name: `API 문서화`,
      lead: `아무리 잘 만든 API도 쓰는 법을 모르면 쓸 수 없습니다. 문서가 코드와 어긋나지 않게 하고, 읽는 사람이 바로 호출해 볼 수 있게 하는 방법입니다.`,
      lessons: [
        {
          id: 'l1', short: `자동 생성`,
          title: `API 문서는 코드에서 자동으로 만들기`,
          ver: `springdoc-openapi`,
          lang: 'plain',
          why: `손으로 쓴 문서는 코드가 바뀔 때 함께 고치지 않게 되고, 틀린 문서는 없는 것보다 나쁩니다. 코드에서 만들어 내면 어긋날 수 없습니다.`,
          bad: String.raw`
# 위키 문서 "주문 API 명세 (최종_진짜최종_v3)"
POST /orders
  요청: memberId, items
  응답: orderId

# 코드는 석 달 전에 바뀌었는데 문서는 그대로
`,
          good: String.raw`
// build.gradle.kts
implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.6.0")

# 실행하면 바로 볼 수 있다
#   /swagger-ui.html    화면에서 직접 호출해 볼 수 있는 문서
#   /v3/api-docs        다른 도구가 읽는 명세 (OpenAPI)
`,
        },
        {
          id: 'l2', short: `@Schema`,
          title: `필드마다 뜻과 예시 값 적기`,
          ver: `springdoc-openapi`,
          why: `자동으로 만든 문서도 필드 이름만 나오면 무슨 값을 넣어야 하는지 알 수 없습니다. 설명과 예시 값을 붙이면 읽는 사람이 바로 따라 할 수 있습니다.`,
          bad: String.raw`
public record OrderRequest(Long mId, List<Long> ids, Integer p) {}
// 문서에 mId, ids, p 로만 나온다
`,
          good: String.raw`
public record OrderRequest(
        @Schema(description = "주문하는 회원 번호", example = "1024")
        Long memberId,

        @Schema(description = "주문할 상품 번호 목록", example = "[31, 57]")
        List<Long> itemIds,

        @Schema(description = "사용할 포인트. 없으면 0", example = "500")
        Integer usePoint) {}
`,
        },
        {
          id: 'l3', short: `응답 코드`,
          title: `실패했을 때의 응답도 문서에`,
          ver: `springdoc-openapi`,
          why: `성공 응답만 적힌 문서로는 오류 처리를 만들 수 없습니다. 어떤 상황에 어떤 코드가 오는지 함께 적습니다.`,
          bad: String.raw`
@PostMapping("/orders")
public OrderResponse place(@RequestBody OrderRequest request) { ... }
// 문서에는 "200 OK"만 나온다
`,
          good: String.raw`
@Operation(summary = "주문 생성", description = "재고를 확인하고 결제까지 처리한다")
@ApiResponse(responseCode = "201", description = "주문 완료")
@ApiResponse(responseCode = "400", description = "입력값 오류")
@ApiResponse(responseCode = "409", description = "재고 부족")
@PostMapping("/orders")
public ResponseEntity<OrderResponse> place(@RequestBody @Valid OrderRequest request) { ... }
`,
        },
        {
          id: 'l4', short: `Javadoc`,
          title: `문서 주석에는 이름에 없는 약속을 쓰기`,
          why: `"회원을 찾는다"는 메서드 이름에 이미 있습니다. 문서 주석에는 어떤 값을 넣어야 하는지, null이 올 수 있는지, 언제 예외가 나는지를 씁니다.`,
          bad: String.raw`
/**
 * 회원을 찾는다.
 * @param id 아이디
 * @return 회원
 */
public Member find(long id) { ... }
`,
          good: String.raw`
/**
 * 탈퇴하지 않은 회원을 번호로 찾는다.
 *
 * @param id 회원 번호. 1 이상
 * @return 찾은 회원. null이 아니다
 * @throws MemberNotFoundException 없거나 탈퇴한 회원일 때
 */
public Member find(long id) { ... }
`,
        },
        {
          id: 'l5', short: `README`,
          title: `README에는 실행하는 법을 쓰기`,
          lang: 'plain',
          why: `새로 온 사람이 저장소를 받아 처음 하는 일은 실행해 보는 것입니다. 무엇이 필요하고 어떤 명령을 치면 되는지가 README의 첫 번째 임무입니다.`,
          bad: String.raw`
# shop-api

쇼핑몰 API 서버입니다.
`,
          good: String.raw`
# shop-api
쇼핑몰 주문과 결제를 담당하는 API 서버

## 실행
1. 필요한 것 : JDK 21, Docker
2. docker compose up -d       MySQL, Redis 실행
3. ./gradlew bootRun
4. http://localhost:8080/swagger-ui.html

## 테스트
./gradlew test
`,
        },
        {
          id: 'l6', short: `변경 기록`,
          title: `무엇이 바뀌었는지 읽는 사람의 말로`,
          lang: 'plain',
          why: `"버그 수정, 기능 개선"은 아무 정보도 주지 않습니다. API를 쓰는 사람이 자기 코드를 고쳐야 하는지 판단할 수 있게 구체적으로 씁니다.`,
          bad: String.raw`
v1.4.2
- 버그 수정
- 기능 개선
`,
          good: String.raw`
## 1.4.2 (2026-11-10)

### 추가
- 주문 목록 응답에 deliveryStatus 필드 추가

### 수정
- 주문 취소 시 포인트가 환불되지 않던 문제

### 주의
- /orders 의 size 최댓값이 1000에서 100으로 줄었습니다
`,
        },
        {
          id: 'l7', short: `검증된 예시`,
          title: `문서의 예시는 테스트로 검증`,
          ver: `Spring REST Docs`,
          why: `손으로 적은 예시 응답은 필드 이름이 바뀌어도 그대로 남습니다. 테스트에서 실제 응답으로 문서 조각을 만들면 응답이 바뀔 때 테스트가 먼저 실패합니다.`,
          bad: String.raw`
// 문서의 예시 응답을 손으로 적어 둠
// { "orderId": 1, "status": "PAID" }
// 실제 응답은 필드 이름이 바뀌어 { "id": 1, "orderStatus": "PAID" }
`,
          good: String.raw`
@Test
void 주문_조회() throws Exception {
    mockMvc.perform(get("/orders/{id}", 1L))
            .andExpect(status().isOk())
            .andDo(document("order-get",
                    responseFields(
                            fieldWithPath("id").description("주문 번호"),
                            fieldWithPath("orderStatus").description("주문 상태"))));
}
// 응답 모양이 바뀌면 이 테스트가 실패한다
`,
        },
        {
          id: 'l8', short: `폐기 예고`,
          title: `없앨 API는 문서에 표시하고 날짜를 알리기`,
          ver: `springdoc-openapi`,
          why: `어느 날 갑자기 사라진 API는 그것을 쓰던 모든 서비스의 장애가 됩니다. 문서에 폐기 표시를 하고, 언제 없어지며 대신 무엇을 써야 하는지 적습니다.`,
          bad: String.raw`
@GetMapping("/v1/orders")   // 쓰지 말아야 하는데 문서에는 아무 표시가 없음
public List<OrderResponse> list() { ... }
`,
          good: String.raw`
@Deprecated
@Operation(summary = "주문 목록 (v1)", deprecated = true,
        description = "2027-03-01에 제거됩니다. /v2/orders 를 쓰세요")
@GetMapping("/v1/orders")
public List<OrderResponse> list() { ... }
`,
        },
        {
          id: 'l9', short: `결정 기록`,
          title: `왜 그렇게 했는지 기록 남기기`,
          lang: 'plain',
          why: `코드는 무엇을 하는지 보여 주지만 왜 그렇게 했는지는 말해 주지 않습니다. 중요한 결정마다 상황, 결정, 감수한 것을 짧게 적어 저장소에 둡니다.`,
          bad: String.raw`
"결제는 왜 따로 서버로 뺐어요?"
"글쎄요, 제가 오기 전부터 그랬어요."
`,
          good: String.raw`
# docs/adr/0007-결제-서버-분리.md

## 상황
결제 장애가 주문 조회까지 멈추게 하는 일이 분기에 두 번 있었다.

## 결정
결제를 별도 서버로 분리하고 주문과는 메시지로 통신한다.

## 감수한 것
배포 대상이 하나 늘고, 결제 결과 반영이 최대 수 초 늦어진다.
`,
        },
        {
          id: 'l10', short: `호출 예시`,
          title: `바로 실행할 수 있는 호출 예시를 저장소에`,
          lang: 'plain',
          why: `호출 방법을 매번 사람에게 물어보고 각자 다른 도구에 손으로 입력하면 시간도 들고 틀리기도 쉽습니다. 실행 가능한 예시 파일을 코드와 함께 둡니다.`,
          bad: String.raw`
"이 API 어떻게 호출해요?"
# 매번 메신저로 물어보고, 각자 다른 도구에 손으로 입력한다
`,
          good: String.raw`
### 주문 생성    (docs/api.http 파일. IDE에서 바로 실행된다)
POST http://localhost:8080/orders
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "memberId": 1024,
  "itemIds": [31, 57],
  "usePoint": 500
}
`,
        },
      ],
    },
    {
      id: 'java-37', no: 37, name: `배치 처리`,
      lead: `수십만 건을 한꺼번에 처리하는 작업의 습관입니다. 요청 하나를 처리할 때는 문제없던 코드가 건수가 늘면 메모리, 락, 재실행에서 무너집니다.`,
      lessons: [
        {
          id: 'l1', short: `나눠서 커밋`,
          title: `대량 작업은 묶음 단위로 커밋`,
          ver: `Spring`,
          why: `트랜잭션 하나에 백만 건을 넣으면 끝날 때까지 락을 쥐고, 마지막 한 건에서 실패해도 전부 되돌려집니다. 일정한 크기로 끊어 각각 커밋합니다.`,
          bad: String.raw`
@Transactional
public void expireAll() {
    List<Coupon> coupons = couponRepository.findExpired();   // 100만 건
    for (Coupon coupon : coupons) {
        coupon.expire();
    }
}   // 99만 번째에서 실패하면 전부 롤백
`,
          good: String.raw`
public void expireAll() {
    while (true) {
        int updated = chunkWorker.expireNext(1000);   // 1000건씩 따로 커밋
        if (updated == 0) break;
    }
}

// 다른 빈의 메서드로 둔다 (21회차 06번)
@Transactional
public int expireNext(int size) {
    List<Coupon> coupons = couponRepository.findExpired(PageRequest.of(0, size));
    coupons.forEach(Coupon::expire);
    return coupons.size();
}
`,
        },
        {
          id: 'l2', short: `재실행`,
          title: `몇 번을 다시 돌려도 결과가 같게`,
          why: `배치는 중간에 죽는 것이 정상입니다. 다시 돌렸을 때 앞에서 처리한 사람이 한 번 더 처리되면 안 됩니다. 처리한 기록을 남기고 시작할 때 확인합니다.`,
          bad: String.raw`
public void payDailyPoints(LocalDate date) {
    for (Member member : memberRepository.findActive()) {
        pointService.add(member.getId(), 100);   // 다시 돌리면 앞사람들은 두 번 받음
    }
}
`,
          good: String.raw`
public void payDailyPoints(LocalDate date) {
    for (Member member : memberRepository.findActive()) {
        if (pointHistory.exists(member.getId(), "DAILY", date)) continue;   // 이미 받은 사람은 건너뛴다
        pointService.add(member.getId(), 100, "DAILY", date);               // 지급 기록을 함께 남긴다
    }
}
`,
        },
        {
          id: 'l3', short: `쪽 번호의 함정`,
          title: `처리하면서 쪽 번호를 올리지 않기`,
          ver: `Spring Data`,
          why: `처리한 건이 조건에서 빠지면 남은 건이 앞으로 당겨집니다. 그 상태에서 다음 쪽을 읽으면 한 쪽 분량을 통째로 건너뜁니다.`,
          bad: String.raw`
int page = 0;
while (true) {
    List<Order> orders = orderRepository.findByStatus(PENDING, PageRequest.of(page++, 100));
    if (orders.isEmpty()) break;
    orders.forEach(Order::complete);   // 처리하면 PENDING에서 빠진다
}
// 1쪽을 처리한 뒤 2쪽을 읽으면 100건을 건너뛴다
`,
          good: String.raw`
while (true) {
    List<Order> orders = orderRepository.findByStatus(PENDING, PageRequest.of(0, 100));   // 항상 첫 쪽
    if (orders.isEmpty()) break;
    orders.forEach(Order::complete);
}

// 상태가 바뀌지 않는 작업이라면 마지막으로 본 id 다음부터 읽는다
// where id > :lastId order by id limit 100
`,
        },
        {
          id: 'l4', short: `중복 실행`,
          title: `서버가 여러 대여도 한 번만 실행`,
          ver: `ShedLock`,
          why: `@Scheduled는 서버마다 따로 돕니다. 서버가 세 대면 정산도 세 번 실행됩니다. 실행 전에 공용 락을 잡아 한 대만 돌게 합니다.`,
          bad: String.raw`
@Scheduled(cron = "0 0 3 * * *")
public void settle() {
    settlementService.run();
}   // 서버가 3대면 새벽 3시에 정산이 세 번 실행된다
`,
          good: String.raw`
@Scheduled(cron = "0 0 3 * * *")
@SchedulerLock(name = "settle", lockAtMostFor = "30m", lockAtLeastFor = "1m")
public void settle() {
    settlementService.run();
}   // 먼저 락을 잡은 서버 한 대만 실행한다
`,
        },
        {
          id: 'l5', short: `실패 격리`,
          title: `한 건의 실패가 전체를 멈추지 않게`,
          why: `십만 명 중 한 명의 데이터가 이상해서 전체가 멈추면 나머지는 아무도 처리되지 않습니다. 실패한 건은 기록하고 넘어가되, 실패가 너무 많으면 멈춥니다.`,
          bad: String.raw`
for (Member member : members) {
    sendMonthlyReport(member);   // 한 명에서 예외가 나면 뒤의 사람들은 전부 못 받음
}
`,
          good: String.raw`
int failed = 0;
for (Member member : members) {
    try {
        sendMonthlyReport(member);
    } catch (Exception e) {
        failed++;
        log.warn("리포트 발송 실패 memberId={}", member.getId(), e);
        failureRepository.save(new BatchFailure("monthly-report", member.getId(), e.getMessage()));
        if (failed > 100) {
            throw new IllegalStateException("실패가 너무 많아 중단", e);   // 전체가 잘못된 것이면 멈춘다
        }
    }
}
`,
        },
        {
          id: 'l6', short: `진행 로그`,
          title: `얼마나 됐는지 알 수 있게`,
          why: `몇 시간짜리 작업이 아무 말 없이 돌면 진행 중인지 멈춘 것인지 구분할 수 없습니다. 시작, 중간, 끝에 숫자를 남깁니다.`,
          bad: String.raw`
public void migrate() {
    for (Order order : orders) {
        convert(order);
    }
}   // 두 시간째 도는 중. 얼마나 됐는지 알 수 없음
`,
          good: String.raw`
public void migrate() {
    log.info("주문 이관 시작 total={}", total);
    long start = System.nanoTime();
    int done = 0;

    for (Order order : orders) {
        convert(order);
        if (++done % 10_000 == 0) {
            log.info("주문 이관 진행 {}/{}", done, total);
        }
    }

    log.info("주문 이관 완료 done={} elapsedSec={}", done, (System.nanoTime() - start) / 1_000_000_000);
}
`,
        },
        {
          id: 'l7', short: `운영 부하`,
          title: `배치가 운영 트래픽을 밀어내지 않게`,
          why: `쉬지 않고 DB를 훑는 배치는 같은 DB를 쓰는 사용자 요청을 느리게 만듭니다. 한가한 시간에 돌리고, 묶음 사이에 숨을 돌립니다.`,
          bad: String.raw`
@Scheduled(cron = "0 0 14 * * *")   // 오후 2시 : 사용자가 가장 많은 시간
public void recalculateAllRankings() {
    productRepository.findAll().forEach(this::recalculate);   // 쉬지 않고 전체를 훑음
}
`,
          good: String.raw`
@Scheduled(cron = "0 0 4 * * *")    // 새벽 4시
public void recalculateAllRankings() {
    long lastId = 0;
    while (true) {
        List<Product> chunk = productRepository.findNext(lastId, 500);
        if (chunk.isEmpty()) break;

        chunk.forEach(this::recalculate);
        lastId = chunk.get(chunk.size() - 1).getId();
        pause(200);                 // 묶음 사이에 0.2초 쉰다
    }
}
`,
        },
        {
          id: 'l8', short: `묶어서 넣기`,
          title: `대량 저장은 묶어서 보내기`,
          ver: `Spring JDBC`,
          why: `save를 건마다 부르면 INSERT가 건수만큼 나갑니다. 자동 증가 키를 쓰는 JPA 엔티티는 묶어 보내지도 못합니다. 대량 저장은 JDBC 배치로 보냅니다.`,
          bad: String.raw`
for (LogRow row : rows) {      // 50만 건
    logRepository.save(row);   // INSERT 50만 번
}
`,
          good: String.raw`
jdbcTemplate.batchUpdate(
        "INSERT INTO access_log (user_id, path, created_at) VALUES (?, ?, ?)",
        rows, 1000,   // 1000건씩 묶어서 전송
        (ps, row) -> {
            ps.setLong(1, row.userId());
            ps.setString(2, row.path());
            ps.setObject(3, row.createdAt());
        });
`,
          note: `MySQL이라면 접속 주소에 <strong>rewriteBatchedStatements=true</strong>를 붙여야 실제로 묶여서 나갑니다.`,
        },
        {
          id: 'l9', short: `flush · clear`,
          title: `JPA로 대량 처리할 때는 주기적으로 비우기`,
          ver: `JPA`,
          why: `JPA는 한 트랜잭션에서 다룬 엔티티를 전부 기억합니다. 수십만 건을 넣으면 그만큼 메모리에 쌓이고 점점 느려집니다. 일정 건수마다 DB로 보내고 비웁니다.`,
          bad: String.raw`
@Transactional
public void importProducts(List<ProductRow> rows) {   // 30만 건
    for (ProductRow row : rows) {
        em.persist(row.toEntity());
    }
}   // 저장한 엔티티가 전부 메모리에 남는다
`,
          good: String.raw`
@Transactional
public void importProducts(List<ProductRow> rows) {
    int count = 0;
    for (ProductRow row : rows) {
        em.persist(row.toEntity());
        if (++count % 1000 == 0) {
            em.flush();   // 쌓인 것을 DB로 보내고
            em.clear();   // 메모리에서 비운다
        }
    }
}
`,
        },
        {
          id: 'l10', short: `기준일`,
          title: `기준 날짜는 인자로 받기`,
          why: `작업 안에서 "오늘"을 구하면 자정을 넘겨 실행되거나 다음 날 다시 돌릴 때 엉뚱한 날짜를 처리합니다. 어느 날짜의 작업인지를 밖에서 받습니다.`,
          bad: String.raw`
@Scheduled(cron = "0 50 23 * * *")
public void closeDaily() {
    LocalDate target = LocalDate.now();   // 자정을 넘기면? 다음 날 다시 돌리면?
    settlementService.close(target);
}
`,
          good: String.raw`
@Scheduled(cron = "0 10 0 * * *")
public void closeDaily() {
    closeDaily(LocalDate.now(clock).minusDays(1));   // "어제"를 분명하게 계산해 넘긴다
}

public void closeDaily(LocalDate target) {   // 날짜를 받는다 : 지난 날짜로 다시 돌릴 수 있다
    settlementService.close(target);
}
`,
        },
      ],
    },
    {
      id: 'java-38', no: 38, name: `알고리즘 심화`,
      lead: `29회차의 기본기에 이어, 코딩 테스트에 자주 나오는 유형별 풀이 틀입니다. 왼쪽은 떠올리기 쉬운 느린 방법이고 오른쪽이 그 유형의 정석입니다.`,
      lessons: [
        {
          id: 'l1', short: `슬라이딩 윈도우`,
          title: `고정 길이 구간은 밀면서 계산`,
          why: `구간을 옮길 때마다 처음부터 다시 더할 필요가 없습니다. 새로 들어온 값을 더하고 빠져나간 값을 빼면 됩니다.`,
          bad: String.raw`
int best = Integer.MIN_VALUE;
for (int i = 0; i + k <= n; i++) {
    int sum = 0;
    for (int j = i; j < i + k; j++) sum += arr[j];   // 구간마다 k개를 다시 더함
    best = Math.max(best, sum);
}
`,
          good: String.raw`
int sum = 0;
for (int i = 0; i < k; i++) sum += arr[i];   // 첫 구간

int best = sum;
for (int i = k; i < n; i++) {
    sum += arr[i] - arr[i - k];              // 하나 들어오고 하나 나간다
    best = Math.max(best, sum);
}
`,
        },
        {
          id: 'l2', short: `해시로 짝 찾기`,
          title: `짝을 찾을 때는 본 값을 기억해 두기`,
          why: `모든 쌍을 비교하는 대신, 지나온 값을 Map에 넣어 두고 "지금 값의 짝을 이미 봤는가"를 묻습니다. 한 번 훑는 것으로 끝납니다.`,
          bad: String.raw`
for (int i = 0; i < n; i++) {
    for (int j = i + 1; j < n; j++) {
        if (nums[i] + nums[j] == target) return new int[] {i, j};
    }
}
return null;
`,
          good: String.raw`
Map<Integer, Integer> seen = new HashMap<>();   // 값 → 위치
for (int i = 0; i < n; i++) {
    Integer j = seen.get(target - nums[i]);     // 짝이 되는 값을 이미 봤는가
    if (j != null) return new int[] {j, i};
    seen.put(nums[i], i);
}
return null;
`,
        },
        {
          id: 'l3', short: `DFS`,
          title: `그래프 탐색에는 방문 표시`,
          why: `방문한 곳을 표시하지 않으면 서로 연결된 두 정점 사이를 끝없이 오갑니다. 방문 배열을 두면 연결된 덩어리의 수도 함께 셀 수 있습니다.`,
          bad: String.raw`
void dfs(int node) {
    for (int next : graph.get(node)) {
        dfs(next);   // 1 → 2 → 1 → 2 ... StackOverflowError
    }
}
`,
          good: String.raw`
boolean[] visited = new boolean[n];

void dfs(int node) {
    visited[node] = true;
    for (int next : graph.get(node)) {
        if (!visited[next]) dfs(next);
    }
}

int groups = 0;   // 연결된 덩어리의 수
for (int i = 0; i < n; i++) {
    if (!visited[i]) { dfs(i); groups++; }
}
`,
        },
        {
          id: 'l4', short: `유니온 파인드`,
          title: `같은 묶음인지 자주 물으면 유니온 파인드`,
          why: `연결 여부를 물을 때마다 탐색하면 질문 수만큼 전체를 훑습니다. 묶음마다 대표를 정해 두면 두 원소의 대표가 같은지만 보면 됩니다.`,
          bad: String.raw`
boolean connected(int a, int b) {
    return bfs(a).contains(b);   // 질문이 10만 번이면 탐색도 10만 번
}
`,
          good: String.raw`
int[] parent = new int[n];
for (int i = 0; i < n; i++) parent[i] = i;   // 처음에는 각자 자기 자신이 대표

int find(int x) {
    if (parent[x] != x) parent[x] = find(parent[x]);   // 대표를 찾으면서 길을 줄인다
    return parent[x];
}

void union(int a, int b) { parent[find(a)] = find(b); }

boolean connected(int a, int b) { return find(a) == find(b); }
`,
        },
        {
          id: 'l5', short: `다익스트라`,
          title: `길마다 비용이 다르면 다익스트라`,
          why: `BFS는 모든 길의 비용이 같을 때만 최단 거리를 줍니다. 비용이 다르면 "지금까지 가장 가까운 곳"부터 꺼내는 우선순위 큐가 필요합니다.`,
          bad: String.raw`
// 길마다 걸리는 시간이 다른데 BFS로 "거친 칸 수"가 가장 적은 길을 찾음
// 칸 수는 적지만 시간은 더 걸리는 길이 답으로 나온다
`,
          good: String.raw`
long[] dist = new long[n];
Arrays.fill(dist, Long.MAX_VALUE);
dist[start] = 0;

PriorityQueue<long[]> pq = new PriorityQueue<>((a, b) -> Long.compare(a[1], b[1]));   // {정점, 거리}
pq.offer(new long[] {start, 0});

while (!pq.isEmpty()) {
    long[] cur = pq.poll();
    int u = (int) cur[0];
    if (cur[1] > dist[u]) continue;       // 더 짧은 길을 이미 찾았으면 버린다

    for (int[] edge : graph.get(u)) {     // edge = {도착 정점, 비용}
        long next = dist[u] + edge[1];
        if (next < dist[edge[0]]) {
            dist[edge[0]] = next;
            pq.offer(new long[] {edge[0], next});
        }
    }
}
`,
        },
        {
          id: 'l6', short: `그리디`,
          title: `회의실 배정은 끝나는 시간 순서로`,
          why: `그리디는 정렬 기준이 전부입니다. 일찍 시작하는 것부터 고르면 긴 회의 하나가 나머지를 막습니다. 일찍 끝나는 것부터 골라야 뒤에 남는 시간이 가장 많습니다.`,
          bad: String.raw`
// 시작 시간이 빠른 회의부터 고른다
Arrays.sort(meetings, (a, b) -> a[0] - b[0]);
// 일찍 시작해 하루 종일 이어지는 회의 하나가 나머지를 전부 막는다
`,
          good: String.raw`
// 끝나는 시간이 빠른 회의부터 고른다
Arrays.sort(meetings, (a, b) -> a[1] != b[1] ? a[1] - b[1] : a[0] - b[0]);

int count = 0, lastEnd = 0;
for (int[] m : meetings) {   // m = {시작, 끝}
    if (m[0] >= lastEnd) {   // 앞 회의가 끝난 뒤에 시작하면 고른다
        count++;
        lastEnd = m[1];
    }
}
`,
        },
        {
          id: 'l7', short: `배낭 DP`,
          title: `배낭 문제는 무게별 최댓값 표로`,
          why: `넣는 경우와 안 넣는 경우를 모두 따라가면 물건 수에 따라 경우가 두 배씩 늘어납니다. 무게마다 최댓값을 표에 적어 가면 물건 수와 용량의 곱만큼만 계산합니다.`,
          bad: String.raw`
// 물건마다 "넣는다 / 안 넣는다"를 전부 따라감 : 40개면 1조 가지
int best(int i, int remain) {
    if (i == n) return 0;
    int skip = best(i + 1, remain);
    int take = weight[i] <= remain ? value[i] + best(i + 1, remain - weight[i]) : 0;
    return Math.max(skip, take);
}
`,
          good: String.raw`
int[] dp = new int[capacity + 1];   // dp[w] : 무게 w까지 담을 때의 최대 가치

for (int i = 0; i < n; i++) {
    for (int w = capacity; w >= weight[i]; w--) {   // 뒤에서부터 : 같은 물건을 두 번 넣지 않게
        dp[w] = Math.max(dp[w], dp[w - weight[i]] + value[i]);
    }
}
// dp[capacity] 가 답
`,
        },
        {
          id: 'l8', short: `위상 정렬`,
          title: `선후 관계가 있으면 위상 정렬`,
          why: `"이것을 먼저 해야 저것을 할 수 있다"는 조건이 있으면 번호 순서로는 안 됩니다. 먼저 해야 할 것이 남아 있지 않은 것부터 차례로 꺼냅니다.`,
          bad: String.raw`
// 선수 과목이 있는데 번호 순서대로 수강
for (int course = 0; course < n; course++) {
    take(course);   // 3번의 선수 과목이 5번이면 순서가 틀린다
}
`,
          good: String.raw`
int[] indegree = new int[n];                      // 아직 안 들은 선수 과목 수
for (int[] p : prerequisites) indegree[p[1]]++;   // p = {먼저, 나중}

Deque<Integer> queue = new ArrayDeque<>();
for (int i = 0; i < n; i++) if (indegree[i] == 0) queue.offer(i);   // 선수 과목이 없는 것부터

List<Integer> order = new ArrayList<>();
while (!queue.isEmpty()) {
    int cur = queue.poll();
    order.add(cur);
    for (int next : graph.get(cur)) {
        if (--indegree[next] == 0) queue.offer(next);   // 선수 과목을 다 들었으면 수강 가능
    }
}
// order.size() < n 이면 서로 물고 물리는 과목이 있다
`,
        },
        {
          id: 'l9', short: `백트래킹`,
          title: `틀린 가지는 일찍 잘라 내기`,
          why: `모든 배치를 끝까지 만든 뒤에 검사하면 이미 틀린 배치의 나머지까지 전부 만듭니다. 놓는 순간에 검사해서 틀리면 그 아래는 보지 않습니다.`,
          bad: String.raw`
// 퀸 N개의 모든 배치를 만든 뒤에 하나씩 검사
void place(int row) {
    if (row == n) { if (isValid(cols)) count++; return; }
    for (int c = 0; c < n; c++) {
        cols[row] = c;
        place(row + 1);   // 이미 틀린 배치도 끝까지 만든다
    }
}
`,
          good: String.raw`
void place(int row) {
    if (row == n) { count++; return; }
    for (int c = 0; c < n; c++) {
        if (!canPlace(row, c)) continue;   // 놓을 수 없으면 그 아래는 보지 않는다
        cols[row] = c;
        place(row + 1);
    }
}

boolean canPlace(int row, int c) {
    for (int r = 0; r < row; r++) {
        if (cols[r] == c || Math.abs(cols[r] - c) == row - r) return false;   // 같은 열, 대각선
    }
    return true;
}
`,
        },
        {
          id: 'l10', short: `나머지 연산`,
          title: `큰 수의 나머지는 곱할 때마다`,
          why: `"1,000,000,007로 나눈 나머지를 출력하라"는 문제에서 int끼리 곱하면 나머지를 구하기도 전에 넘칩니다. long으로 곱하고 곱할 때마다 나머지를 구합니다.`,
          bad: String.raw`
int MOD = 1_000_000_007;
int result = 1;
for (int i = 1; i <= n; i++) {
    result = result * i % MOD;   // int끼리 곱하는 순간 넘친다
}
`,
          good: String.raw`
final int MOD = 1_000_000_007;
long result = 1;
for (int i = 1; i <= n; i++) {
    result = result * i % MOD;   // long으로 곱하고, 곱할 때마다 나머지
}

// 뺄셈은 음수가 될 수 있으니 MOD를 더해 준다
long diff = ((a - b) % MOD + MOD) % MOD;
`,
        },
      ],
    },
    {
      id: 'java-39', no: 39, name: `실전 리팩터링 사례`,
      lead: `18회차의 손질법을 실제로 자주 만나는 코드에 적용한 사례입니다. 하나하나는 작은 변화지만, 잘못 쓰기 어려운 코드로 바꾸는 방향은 같습니다.`,
      lessons: [
        {
          id: 'l1', short: `타입 분기`,
          title: `종류를 묻는 switch는 다형성으로`,
          why: `종류를 나타내는 문자열로 분기하는 switch가 메서드마다 반복되면, 종류를 하나 추가할 때 그 모든 곳을 찾아 고쳐야 합니다. 종류마다 자기 동작을 갖게 합니다.`,
          bad: String.raw`
double area(Shape shape) {
    switch (shape.getType()) {
        case "CIRCLE":    return Math.PI * shape.getRadius() * shape.getRadius();
        case "RECTANGLE": return shape.getWidth() * shape.getHeight();
        default: throw new IllegalArgumentException(shape.getType());
    }
}
// perimeter()에도, draw()에도 같은 switch가 반복된다
`,
          good: String.raw`
interface Shape {
    double area();
    double perimeter();
}

record Circle(double radius) implements Shape {
    public double area() { return Math.PI * radius * radius; }
    public double perimeter() { return 2 * Math.PI * radius; }
}

record Rectangle(double width, double height) implements Shape {
    public double area() { return width * height; }
    public double perimeter() { return 2 * (width + height); }
}
`,
        },
        {
          id: 'l2', short: `함께 다니는 값`,
          title: `늘 함께 다니는 값은 하나의 타입으로`,
          why: `시작일과 종료일처럼 항상 같이 넘어 다니는 값은 사실 하나의 개념입니다. 묶어 두면 "시작이 끝보다 앞인가" 같은 검사와 관련 계산이 한 곳에 모입니다.`,
          bad: String.raw`
List<Order> find(LocalDate startDate, LocalDate endDate) { ... }
long sum(LocalDate startDate, LocalDate endDate) { ... }
boolean overlaps(LocalDate s1, LocalDate e1, LocalDate s2, LocalDate e2) { ... }
// 두 날짜가 늘 함께 다니고, 순서 검사가 곳곳에 반복된다
`,
          good: String.raw`
record DateRange(LocalDate start, LocalDate end) {
    DateRange {
        if (start.isAfter(end)) throw new IllegalArgumentException("시작이 끝보다 늦음");
    }
    boolean contains(LocalDate date) {
        return !date.isBefore(start) && !date.isAfter(end);
    }
    boolean overlaps(DateRange other) {
        return !end.isBefore(other.start) && !other.end.isBefore(start);
    }
}

List<Order> find(DateRange period) { ... }
`,
        },
        {
          id: 'l3', short: `완성된 객체`,
          title: `만들다 만 객체가 돌아다니지 않게`,
          why: `빈 객체를 만들고 setter로 하나씩 채우면 하나를 빠뜨려도 컴파일이 됩니다. 필요한 값을 생성자에서 모두 받으면 덜 채워진 객체는 존재할 수 없습니다.`,
          bad: String.raw`
Order order = new Order();
order.setMember(member);
order.setItems(items);
// setAddress를 빠뜨림
orderService.place(order);   // 주소가 null인 주문이 만들어진다
`,
          good: String.raw`
public class Order {
    public Order(Member member, List<Item> items, Address address) {
        this.member = Objects.requireNonNull(member);
        this.items = List.copyOf(items);
        this.address = Objects.requireNonNull(address);   // 없으면 만들 수 없다
    }
}

Order order = new Order(member, items, address);
`,
        },
        {
          id: 'l4', short: `주석 단락`,
          title: `단락을 나누는 주석은 메서드 이름으로`,
          why: `긴 메서드 안에 "재고 확인", "금액 계산" 같은 주석으로 단락을 나눴다면, 그 주석이 곧 뽑아낼 메서드의 이름입니다.`,
          bad: String.raw`
public void process(Order order) {
    // 재고 확인
    for (Item item : order.getItems()) {
        if (stock.get(item) < item.getCount()) throw new SoldOutException(item);
    }
    // 금액 계산
    long total = 0;
    for (Item item : order.getItems()) total += item.getPrice() * item.getCount();
    if (order.hasCoupon()) total -= order.getCoupon().getAmount();
    // 결제
    ...
}
`,
          good: String.raw`
public void process(Order order) {
    checkStock(order);
    long total = calculateTotal(order);
    pay(order, total);
}
`,
        },
        {
          id: 'l5', short: `상태 하나로`,
          title: `boolean 여러 개 대신 상태 하나`,
          why: `상태를 boolean 여러 개로 나타내면 "결제 전인데 배송됨"처럼 있을 수 없는 조합이 만들어집니다. 가능한 상태만 나열한 enum 하나로 바꿉니다.`,
          bad: String.raw`
class Order {
    boolean paid;
    boolean shipped;
    boolean canceled;
}
// paid=false, shipped=true ?  canceled=true, shipped=true ?
`,
          good: String.raw`
class Order {
    OrderStatus status;   // CREATED, PAID, SHIPPED, CANCELED 중 정확히 하나
}

if (order.status == OrderStatus.SHIPPED) { ... }
`,
        },
        {
          id: 'l6', short: `컬렉션 감싸기`,
          title: `규칙이 있는 컬렉션은 클래스로 감싸기`,
          why: `리스트를 그대로 들고 다니면 합계 계산과 개수 제한 같은 규칙이 쓰는 곳마다 복사됩니다. 컬렉션을 클래스로 감싸면 규칙이 한 곳에 모입니다.`,
          bad: String.raw`
List<Item> items = cart.getItems();

long total = 0;   // 합계 계산이 화면마다, 서비스마다 복사됨
for (Item item : items) total += item.getPrice() * item.getCount();

if (items.size() > 20) throw new IllegalStateException("20개까지");   // 규칙도 흩어짐
`,
          good: String.raw`
class CartItems {
    private static final int MAX = 20;
    private final List<Item> items = new ArrayList<>();

    void add(Item item) {
        if (items.size() >= MAX) throw new IllegalStateException("20개까지 담을 수 있습니다");
        items.add(item);
    }

    long total() {
        return items.stream().mapToLong(i -> i.getPrice() * i.getCount()).sum();
    }
}
`,
        },
        {
          id: 'l7', short: `규칙 목록`,
          title: `늘어나는 검증은 규칙 목록으로`,
          why: `검증 규칙을 if로 이어 쓰면 규칙이 늘 때마다 메서드가 길어지고, 첫 오류에서 멈춰 나머지는 알려 주지 못합니다. 규칙을 데이터로 만들면 추가는 한 줄이고 오류를 한 번에 모을 수 있습니다.`,
          bad: String.raw`
void validate(SignupRequest r) {
    if (r.email() == null || !r.email().contains("@")) throw new IllegalArgumentException("이메일");
    if (r.password().length() < 8) throw new IllegalArgumentException("비밀번호 길이");
    if (!r.password().matches(".*\\d.*")) throw new IllegalArgumentException("비밀번호 숫자");
    if (r.age() < 14) throw new IllegalArgumentException("나이");
}
`,
          good: String.raw`
record Rule(Predicate<SignupRequest> ok, String message) {}

private static final List<Rule> RULES = List.of(
        new Rule(r -> r.email() != null && r.email().contains("@"), "이메일 형식이 아닙니다"),
        new Rule(r -> r.password().length() >= 8, "비밀번호는 8자 이상입니다"),
        new Rule(r -> r.password().matches(".*\\d.*"), "비밀번호에 숫자가 필요합니다"),
        new Rule(r -> r.age() >= 14, "14세 이상만 가입할 수 있습니다"));

List<String> validate(SignupRequest request) {
    return RULES.stream()
            .filter(rule -> !rule.ok().test(request))
            .map(Rule::message)
            .toList();   // 틀린 것을 한 번에 모두 알려 준다
}
`,
        },
        {
          id: 'l8', short: `반환값으로`,
          title: `인자를 몰래 채우지 말고 반환하기`,
          why: `넘겨받은 리스트에 결과를 채워 넣는 메서드는 호출하는 코드만 봐서는 무엇이 바뀌는지 알 수 없습니다. 결과는 반환값으로 돌려줍니다.`,
          bad: String.raw`
void collectErrors(Order order, List<String> errors) {   // 받은 리스트를 채운다
    if (order.getItems().isEmpty()) errors.add("상품이 없습니다");
}

List<String> errors = new ArrayList<>();
collectErrors(order, errors);   // 호출만 봐서는 errors가 바뀌는지 알 수 없음
`,
          good: String.raw`
List<String> findErrors(Order order) {
    List<String> errors = new ArrayList<>();
    if (order.getItems().isEmpty()) errors.add("상품이 없습니다");
    return errors;
}

List<String> errors = findErrors(order);
`,
        },
        {
          id: 'l9', short: `Map 대신 타입`,
          title: `Map에 담아 넘기지 말고 타입으로`,
          why: `문자열 키로 값을 주고받으면 키의 오타도, 타입이 틀린 것도 실행해 봐야 드러납니다. 필드가 정해진 타입으로 바꾸면 컴파일러가 잡습니다.`,
          bad: String.raw`
Map<String, Object> params = new HashMap<>();
params.put("userId", 1024L);
params.put("ammount", 5000);   // 오타
params.put("date", "2026-11-11");

long amount = (Integer) params.get("amount");   // NullPointerException
`,
          good: String.raw`
record PaymentRequest(long userId, long amount, LocalDate date) {}

PaymentRequest request = new PaymentRequest(1024L, 5000, LocalDate.of(2026, 11, 11));
long amount = request.amount();   // 이름이 틀리면 컴파일 오류
`,
        },
        {
          id: 'l10', short: `나란히 돌리기`,
          title: `오래된 핵심 로직은 새 코드와 나란히 돌려 보고 교체`,
          why: `수년 된 로직을 한 번에 갈아 끼우면 결과가 달라졌을 때 어디가 다른지 비교할 방법이 없습니다. 한동안 둘 다 돌려 결과를 비교하고, 차이가 없어진 뒤에 바꿉니다.`,
          bad: String.raw`
// 5년 된 정산 로직 3000줄을 새 코드로 한 번에 교체
return newSettlement.calculate(order);
// 금액이 다르다는 문의가 오는데 어디가 다른지 비교할 방법이 없다
`,
          good: String.raw`
long oldResult = oldSettlement.calculate(order);   // 당분간은 옛 코드의 결과를 쓴다

try {
    long newResult = newSettlement.calculate(order);   // 새 코드는 옆에서 함께 돌린다
    if (oldResult != newResult) {
        log.warn("정산 결과 불일치 orderId={} old={} new={}", order.getId(), oldResult, newResult);
    }
} catch (Exception e) {
    log.warn("새 정산 로직 오류 orderId={}", order.getId(), e);
}
return oldResult;
// 불일치 로그가 나오지 않게 되면 그때 새 코드로 바꾼다
`,
        },
      ],
    },
    {
      id: 'java-40', no: 40, name: `면접 단골 질문`,
      lead: `자바 면접에서 거의 빠지지 않는 질문들을 코드로 확인합니다. 이 회차는 나쁜 예와 좋은 예가 아니라, 왼쪽이 흔한 오해이고 오른쪽이 실제 동작입니다.`,
      lessons: [
        {
          id: 'l1', short: `문자열 풀`,
          title: `"java" == "java" 는 왜 true인가`,
          badLabel: `✕ 흔한 오해`, goodLabel: `✓ 실제 동작`,
          why: `같은 문자열 리터럴은 "문자열 풀"에 하나만 만들어져 함께 쓰입니다. new로 만든 것은 풀과 상관없는 새 객체입니다. 그래서 ==의 결과가 만드는 방법에 따라 달라집니다.`,
          bad: String.raw`
String a = "java";
String b = "java";
String c = new String("java");

// "내용이 같으니 ==도 전부 true다"
a == b;   // ?
a == c;   // ?
`,
          good: String.raw`
a == b;            // true  : 같은 리터럴은 풀의 한 객체를 함께 쓴다
a == c;            // false : new는 항상 새 객체를 만든다
a.equals(c);       // true  : 내용 비교는 equals
a == c.intern();   // true  : intern은 풀에 있는 객체를 돌려준다
`,
        },
        {
          id: 'l2', short: `값 전달`,
          title: `자바는 참조로 넘기는가, 값으로 넘기는가`,
          badLabel: `✕ 흔한 오해`, goodLabel: `✓ 실제 동작`,
          why: `자바는 항상 값을 복사해 넘깁니다. 객체를 넘길 때 복사되는 것은 "객체가 어디 있는지"입니다. 그래서 내용을 바꾸면 보이지만 다른 객체를 대입하면 보이지 않습니다.`,
          bad: String.raw`
void reset(List<String> list) {
    list = new ArrayList<>();   // "참조로 넘어왔으니 호출한 쪽도 빈 리스트가 된다"
}

List<String> names = new ArrayList<>(List.of("kim"));
reset(names);
names.size();   // ?
`,
          good: String.raw`
names.size();   // 1 : 매개변수에 새 객체를 대입해도 내 복사본만 바뀐다

void clear(List<String> list) {
    list.clear();   // 같은 객체를 가리키므로 내용을 바꾸면 호출한 쪽에도 보인다
}

clear(names);
names.size();   // 0
`,
        },
        {
          id: 'l3', short: `final`,
          title: `final 변수의 객체는 바꿀 수 있는가`,
          badLabel: `✕ 흔한 오해`, goodLabel: `✓ 실제 동작`,
          why: `final은 변수가 다른 객체를 가리키지 못하게 할 뿐, 가리키는 객체의 내용까지 막지는 않습니다. 내용까지 못 바꾸게 하려면 객체 자체가 불변이어야 합니다.`,
          bad: String.raw`
final List<String> list = new ArrayList<>();

// "final이니까 이 리스트는 바꿀 수 없다"
list.add("a");   // ?
`,
          good: String.raw`
final List<String> list = new ArrayList<>();

list.add("a");              // 된다
list = new ArrayList<>();   // 컴파일 오류 : final이 막는 것은 이것

List<String> fixed = List.of("a");   // 내용까지 막으려면 불변 컬렉션
`,
        },
        {
          id: 'l4', short: `오버로딩`,
          title: `오버로딩과 오버라이딩은 언제 결정되는가`,
          badLabel: `✕ 흔한 오해`, goodLabel: `✓ 실제 동작`,
          why: `오버로딩은 컴파일할 때 변수의 선언 타입을 보고 고릅니다. 오버라이딩은 실행할 때 실제 객체의 타입을 보고 고릅니다. 이름이 비슷하지만 결정되는 시점이 다릅니다.`,
          bad: String.raw`
void print(Object o) { System.out.println("Object"); }
void print(String s) { System.out.println("String"); }

Object value = "hello";
print(value);   // "실제로 든 것이 String이니 String이 출력된다" ?
`,
          good: String.raw`
print(value);            // "Object" : 선언 타입(Object)으로 고른다
print((String) value);   // "String"

// 오버라이딩은 실제 객체의 타입으로 고른다
Animal a = new Dog();
a.sound();               // Dog의 sound()가 실행된다
`,
        },
        {
          id: 'l5', short: `추상 클래스`,
          title: `추상 클래스와 인터페이스는 언제 쓰는가`,
          badLabel: `✕ 흔한 오해`, goodLabel: `✓ 실제 동작`,
          why: `인터페이스는 "할 수 있는 일"을 나타내고 여러 개를 구현할 수 있습니다. 추상 클래스는 "무엇인가"를 나타내고 상태와 공통 구현을 가지지만 하나만 상속할 수 있습니다.`,
          bad: String.raw`
// "둘 다 추상 메서드를 가지니 아무거나 써도 된다"
abstract class Flyable { abstract void fly(); }

class Bird extends Animal, Flyable { }   // 컴파일 오류 : 클래스는 하나만 상속할 수 있다
`,
          good: String.raw`
interface Flyable { void fly(); }      // 할 수 있는 일. 여러 개 구현 가능
interface Swimmable { void swim(); }

abstract class Animal {                // 무엇인가. 상태와 공통 구현을 가진다
    protected final String name;
    Animal(String name) { this.name = name; }
}

class Duck extends Animal implements Flyable, Swimmable { ... }
`,
        },
        {
          id: 'l6', short: `얕은 복사`,
          title: `리스트를 복사하면 안의 객체도 복사되는가`,
          badLabel: `✕ 흔한 오해`, goodLabel: `✓ 실제 동작`,
          why: `리스트를 복사하면 리스트만 새로 생기고 안의 객체는 같은 것을 가리킵니다. 이것이 얕은 복사입니다. 안의 객체까지 따로 만들어야 깊은 복사입니다.`,
          bad: String.raw`
List<Member> copy = new ArrayList<>(members);   // "복사했으니 원본과 무관하다"
copy.get(0).setName("바뀜");

members.get(0).getName();   // ?
`,
          good: String.raw`
members.get(0).getName();   // "바뀜" : 안의 객체는 같은 것을 가리킨다

// 안의 객체까지 따로 만들어야 서로 영향을 주지 않는다
List<Member> deep = members.stream()
        .map(m -> new Member(m.getName(), m.getAge()))
        .toList();

// 원소가 String이나 record 같은 불변 객체라면 얕은 복사로 충분하다
`,
        },
        {
          id: 'l7', short: `내부 클래스`,
          title: `내부 클래스에 static을 붙이는 이유`,
          badLabel: `✕ 흔한 오해`, goodLabel: `✓ 실제 동작`,
          why: `static이 없는 내부 클래스의 객체는 자신을 만든 바깥 객체를 몰래 붙잡고 있습니다. 내부 객체가 살아 있는 한 바깥 객체도 수거되지 않습니다.`,
          bad: String.raw`
class Outer {
    private byte[] big = new byte[100_000_000];

    class Task implements Runnable {   // "그냥 클래스 안에 클래스를 둔 것"
        public void run() { ... }
    }
}
// Task 객체가 살아 있으면 Outer와 100MB 배열도 수거되지 않는다
`,
          good: String.raw`
class Outer {
    private byte[] big = new byte[100_000_000];

    static class Task implements Runnable {   // 바깥 객체를 붙잡지 않는다
        public void run() { ... }
    }
}
// 바깥의 필드를 쓰지 않는 내부 클래스는 static으로 선언한다
`,
        },
        {
          id: 'l8', short: `StringBuilder`,
          title: `String, StringBuilder, StringBuffer의 차이`,
          badLabel: `✕ 흔한 오해`, goodLabel: `✓ 실제 동작`,
          why: `String은 바뀌지 않고, 나머지 둘은 바꿀 수 있습니다. StringBuffer는 메서드마다 락을 걸어 여러 스레드에서 안전하지만 느리고, StringBuilder는 락이 없어 빠릅니다.`,
          bad: String.raw`
// "셋 다 문자열이니 아무거나 쓰면 된다"
String s = "";
for (String word : words) s += word;    // 매번 새 객체

StringBuffer sb = new StringBuffer();   // 스레드 하나만 쓰는데 매번 락을 건다
`,
          good: String.raw`
// String         불변. 값이 바뀌지 않는 문자열
// StringBuilder  변경 가능, 락 없음. 한 스레드 안에서 이어 붙일 때 (대부분의 경우)
// StringBuffer   변경 가능, 메서드마다 락. 여러 스레드가 함께 쓸 때만

StringBuilder sb = new StringBuilder();
for (String word : words) sb.append(word);
String s = sb.toString();
`,
        },
        {
          id: 'l9', short: `GC`,
          title: `서로 참조하는 객체는 수거되는가`,
          badLabel: `✕ 흔한 오해`, goodLabel: `✓ 실제 동작`,
          why: `자바의 가비지 컬렉터는 참조 개수를 세지 않습니다. 실행 중인 스레드의 변수나 static 필드에서 출발해 닿을 수 있는지를 봅니다. 닿을 길이 없으면 서로 가리키고 있어도 수거됩니다.`,
          bad: String.raw`
// "서로를 참조하는 객체는 영원히 수거되지 않는다"
Node a = new Node();
Node b = new Node();
a.next = b;
b.next = a;

a = null;
b = null;   // ?
`,
          good: String.raw`
// 수거된다 : 밖에서 닿을 길이 없으면 수거 대상이다

static List<Node> cache = new ArrayList<>();
cache.add(new Node());   // static에서 닿으므로 수거되지 않는다
// 메모리 누수는 순환 참조가 아니라 이런 곳에서 생긴다 (20회차 01번)
`,
        },
        {
          id: 'l10', short: `default 충돌`,
          title: `두 인터페이스에 같은 default 메서드가 있으면`,
          badLabel: `✕ 흔한 오해`, goodLabel: `✓ 실제 동작`,
          why: `자바는 어느 쪽을 쓸지 추측하지 않고 컴파일 오류를 냅니다. 구현하는 클래스가 직접 재정의해서 어느 쪽을 쓸지 정해야 합니다.`,
          bad: String.raw`
interface Camera { default String start() { return "촬영 시작"; } }
interface Phone  { default String start() { return "전화 걸기"; } }

class SmartPhone implements Camera, Phone { }
// "둘 중 먼저 적은 것이 쓰인다" ?
`,
          good: String.raw`
// 컴파일 오류가 난다. 어느 쪽을 쓸지 직접 정해야 한다
class SmartPhone implements Camera, Phone {
    @Override
    public String start() {
        return Phone.super.start();   // 인터페이스 이름으로 골라 부른다
    }
}
`,
        },
      ],
    },
    // @@APPEND@@ 새 회차는 이 줄 위에 추가
  ],
  // 다음에 만들 묶음 예고. 없으면 null.
  upcoming: {
    name: `401~500번 후보 주제`,
    items: [
      `도메인 주도 설계`,
      `마이크로서비스 패턴`,
      `리액티브와 WebFlux`,
      `스프링 배치`,
      `관측성과 분산 추적`,
      `gRPC와 GraphQL`,
      `테스트 주도 개발`,
      `클라우드 기초`,
      `장애 대응`,
      `코틀린 맛보기`,
    ],
  },
};

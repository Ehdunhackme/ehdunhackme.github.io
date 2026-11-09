// Original industrial line drawing. Background contours recede through scale and line weight.
// Background-colour fills only hide rear lines; there are no surface fills or shadows.
const ground = 419;
const coordinate = (value: number) => Math.round(value * 100) / 100;
// Both conveyor edges intersect this wall; use the same coordinates for its opening.
const conveyorEntry = {
  x: 561,
  top: coordinate(293 - ((561 - 549) * 94) / 215),
  bottom: coordinate(311 - ((561 - 556) * 94) / 215),
};

// Roofs and walls share vertices. All distant silhouettes are closed so they can
// occlude the landscape without the diagonal fill artefacts of open subpaths.
function DistantBuilding({
  x,
  y,
  width,
  roof = 14,
}: {
  x: number;
  y: number;
  width: number;
  roof?: number;
}) {
  const ridge = x + width * 0.36;
  return (
    <g>
      <polygon
        points={`${x},${ground} ${x},${y} ${ridge},${y - roof} ${x + width},${y} ${x + width},${ground}`}
        fill="var(--bg)"
      />
      <path d={`M${ridge} ${y - roof}V${ground}`} />
      {[17, 34].map((offset) => (
        <path
          key={offset}
          d={`M${x + 10} ${y + offset}H${ridge - 8}M${ridge + 10} ${y + offset}H${x + width - 10}`}
          strokeWidth="0.55"
        />
      ))}
    </g>
  );
}

function Chimney({ x, top, width }: { x: number; top: number; width: number }) {
  const bottom = 346;
  const radiusAt = (y: number) =>
    coordinate(width / 2 + (7 * (y - top)) / (bottom - top));
  return (
    <g transform={`translate(${x} 0)`}>
      <path
        d={`M${-radiusAt(bottom)} ${bottom}L${-width / 2} ${top}H${width / 2}L${radiusAt(bottom)} ${bottom}Z`}
        fill="var(--bg)"
      />
      <ellipse cy={top} rx={width / 2} ry="3" fill="var(--bg)" />
      {[top + 7, top + 13].map((y) => (
        <path
          key={y}
          d={`M${-radiusAt(y)} ${y}q${radiusAt(y)} 5 ${radiusAt(y) * 2} 0`}
        />
      ))}
      <g strokeWidth="0.6" strokeOpacity="0.44">
        {Array.from(
          { length: Math.floor((bottom - top - 14) / 23) },
          (_, i) => {
            const y = top + 28 + i * 23;
            const radius = radiusAt(y);
            return (
              <path
                key={y}
                d={`M${-radius} ${y}q${radius} 5 ${radius * 2} 0`}
              />
            );
          },
        )}
      </g>
    </g>
  );
}

function FactoryWindow({
  x,
  y,
  width = 34,
  height = 38,
}: {
  x: number;
  y: number;
  width?: number;
  height?: number;
}) {
  return (
    <g transform={`translate(${x} ${y})`} strokeWidth="0.75">
      <path d={`M0 ${height}V7Q${width / 2} -5 ${width} 7V${height}Z`} />
      <path d={`M-2 ${height + 3}H${width + 2}`} />
      <path
        d={`M${coordinate(width / 3)} 1.67V${height}M${coordinate((2 * width) / 3)} 1.67V${height}M0 16h${width}M0 28h${width}`}
        strokeOpacity="0.55"
      />
    </g>
  );
}

function Railing({
  x,
  y,
  width,
  height = 13,
}: {
  x: number;
  y: number;
  width: number;
  height?: number;
}) {
  const bays = Math.ceil(width / 22);
  return (
    <g strokeWidth="0.65">
      <path d={`M${x} ${y}h${width}`} />
      {Array.from({ length: bays + 1 }, (_, i) => (
        <path
          key={i}
          d={`M${coordinate(x + (i * width) / bays)} ${y}v${height}`}
        />
      ))}
    </g>
  );
}

function Ladder({
  x,
  top,
  bottom,
  width = 9,
}: {
  x: number;
  top: number;
  bottom: number;
  width?: number;
}) {
  const rungs = Math.floor((bottom - top) / 10);
  return (
    <g strokeWidth="0.65">
      <path d={`M${x} ${bottom}V${top}h${width}V${bottom}`} />
      {Array.from({ length: rungs }, (_, i) => (
        <path
          key={i}
          d={`M${x} ${coordinate(top + ((i + 1) * (bottom - top)) / (rungs + 1))}h${width}`}
        />
      ))}
    </g>
  );
}

function LoadingDoor({
  x,
  y,
  width,
  bottom = ground,
}: {
  x: number;
  y: number;
  width: number;
  bottom?: number;
}) {
  return (
    <g strokeWidth="0.75">
      <rect x={x} y={y} width={width} height={bottom - y} />
      {Array.from({ length: Math.floor((bottom - y) / 9) }, (_, i) => (
        <path
          key={i}
          d={`M${x} ${y + (i + 1) * 8}h${width}`}
          strokeOpacity="0.55"
        />
      ))}
    </g>
  );
}

function Silo({
  x,
  top,
  width,
  bottom = 384,
  base = ground,
}: {
  x: number;
  top: number;
  width: number;
  bottom?: number;
  base?: number;
}) {
  const h = bottom - top;
  return (
    <g transform={`translate(${x} ${top})`}>
      {/* Legs are behind the cone: the vessel masks their upper ends. */}
      <path
        d={`M7 ${h - 33}V${base - top}M${width - 7} ${h - 33}V${base - top}M7 ${base - top - 12}H${width - 7}`}
        strokeWidth="0.8"
      />
      <path
        d={`M0 8Q${width / 2} -9 ${width} 8V${h - 29}L${width / 2 + 7} ${h - 5}H${width / 2 - 7}L0 ${h - 29}Z`}
        fill="var(--bg)"
      />
      <path
        d={`M0 8q${width / 2} 11 ${width} 0M0 ${h - 29}q${width / 2} 11 ${width} 0M${width / 2 - 7} ${h - 5}h14v18h-14Z`}
      />
      <g strokeWidth="0.65" strokeOpacity="0.5">
        {Array.from({ length: Math.floor((h - 45) / 18) }, (_, i) => (
          <path key={i} d={`M0 ${26 + i * 18}q${width / 2} 10 ${width} 0`} />
        ))}
      </g>
    </g>
  );
}

const factoryDrawing = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1800 420"
    fill="none"
    focusable="false"
    preserveAspectRatio="xMidYMax meet"
  >
    <title>Factory landscape</title>
    <desc>
      An original industrial line drawing with a boiler house, enclosed
      conveyor, sawtooth workshop and storage vessels, backed by distant
      buildings and hills.
    </desc>
    {/* A quiet horizon establishes distance without competing with the content. */}
    <g stroke="currentColor" strokeWidth="0.7" strokeOpacity="0.1">
      <path
        d="M-800 251H-40C38 249 90 224 153 220s89 20 155 8 110-53 185-53 114 46 194 38 106-48 179-44 117 31 188 18 111-39 178-30 110 48 180 48 119-26 184-12 115 49 244 35H2600V450H-800Z"
        fill="var(--bg)"
      />
      <path
        d="M-800 282H-40C37 267 91 278 156 255s102 7 171 1 113-25 183-12 98 20 165 12 126-18 194-7 107 16 171 4 108-16 174-3 106 13 171-1 109-12 177 4 144 35 278 12H2600V450H-800Z"
        fill="var(--bg)"
      />
    </g>

    {/* Smaller, softer silhouettes sit behind the working plant. */}
    <g
      fill="var(--bg)"
      stroke="currentColor"
      strokeOpacity="0.19"
      strokeWidth="0.75"
    >
      {[
        [15, 282, 109],
        [260, 260, 93],
        [558, 210, 44],
        [930, 218, 142],
        [1088, 234, 46],
        [1466, 245, 111],
        [1656, 282, 92],
      ].map(([x, y, width]) => (
        <DistantBuilding key={x} x={x} y={y} width={width} />
      ))}
      <path d="M1149 305V174Q1159 169 1169 174V305Z" />
      <path
        d="M1149 174Q1159 180 1169 174M1149 197Q1159 203 1169 197M1149 220Q1159 226 1169 220"
        fill="none"
      />
    </g>
    <g
      stroke="currentColor"
      strokeWidth="1.15"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Distant service buildings, behind the plant rather than a second skyline. */}
      <g strokeWidth="0.8" strokeOpacity="0.24">
        <DistantBuilding x={-30} y={344} width={166} roof={30} />
        <path d="M136 419V321H191V294H254V419Z" fill="var(--bg)" />
        <path d="M171 337H224M171 351H224" />
        <DistantBuilding x={282} y={300} width={83} roof={0} />
        <DistantBuilding x={1530} y={302} width={90} roof={0} />
        <DistantBuilding x={1620} y={351} width={166} roof={28} />
      </g>

      {/* A small travelling gantry and its suspended hook. */}
      <g strokeOpacity="0.43" strokeWidth="1">
        <path
          d="M48 376 62 214h10l14 162ZM261 376l14-162h10l14 162ZM55 214v-19h237v19Z"
          fill="var(--bg)"
        />
        {Array.from({ length: 6 }, (_, i) => {
          const left = 55 + i * 39.5;
          return <path key={i} d={`M${left} 214l19.75-19 19.75 19`} />;
        })}
        <path d="M181 214v63m8-63v63M177 277h16v9h-16ZM185 286v8c0 9-12 10-12 2" />
        <path
          d="M59.2 246.4h15.6m-18.4 32.4h21.2m-24 32.4h26.8m-29.6 32.4h32.4M62 214l12.8 32.4-18.4 32.4 24 32.4-29.6 32.4L86 376M272.2 246.4h15.6m-18.4 32.4h21.2m-24 32.4h26.8m-29.6 32.4h32.4M275 214l12.8 32.4-18.4 32.4 24 32.4-29.6 32.4L299 376"
          strokeWidth="0.65"
        />
      </g>

      {/* Receiving vessels sit clear of the gantry beam above. */}
      <g strokeOpacity="0.64">
        <Silo x={128} top={232} width={47} />
        <Silo x={184} top={216} width={54} />
      </g>

      {/* Tapered stacks: collars, expansion rings and a continuous vertical flue. */}
      <g strokeWidth="1.25" strokeOpacity="0.88">
        <Chimney x={411} top={67} width={30} />
        <Chimney x={516} top={25} width={38} />
      </g>
      {/* The rear process tower has three complete decks and one access ladder. */}
      <g strokeOpacity="0.55">
        <path d="M643 166V337M711 166V337" strokeWidth="0.9" />
        {[172, 237, 285].map((y, i) => {
          const next = [231, 279, 337][i];
          return (
            <path
              key={y}
              d={`M643 ${y}L711 ${next}M711 ${y}L643 ${next}`}
              strokeWidth="0.7"
            />
          );
        })}
        <path d="M657 166V132Q677 118 697 132V166Z" fill="var(--bg)" />
        <path d="M657 132Q677 140 697 132M677 125V98H710V189H758" />
        {[166, 231, 279].map((y) => (
          <g key={y}>
            <rect x="636" y={y} width="83" height="6" fill="var(--bg)" />
            <Railing x={636} y={y - 13} width={83} />
          </g>
        ))}
        <Ladder x={724} top={166} bottom={337} />
        <path d="M719 172H733M719 237H733M719 285H733" strokeWidth="0.65" />
      </g>

      {/* One pier supports the conveyor; the process tower carries its upper span. */}
      <g strokeOpacity="0.64">
        <path d="m549 293 215-94 7 18-215 94Z" fill="var(--bg)" />
        <path d="M552.5 302 767.5 208" strokeWidth="0.75" />
        {[0.2, 0.4, 0.6, 0.8].map((t) => (
          <path
            key={t}
            d={`M${549 + 215 * t} ${293 - 94 * t}l7 18`}
            strokeWidth="0.75"
          />
        ))}
        {[615].map((x) => {
          const leftTop = coordinate(311 - ((x - 556) * 94) / 215);
          const rightTop = coordinate(311 - ((x + 12 - 556) * 94) / 215);
          return (
            <g key={x} strokeWidth="0.75">
              <path
                d={`M${x} ${leftTop}V347M${x + 12} ${rightTop}V347M${x} 300h12M${x} 324h12M${x} 347h12`}
              />
              <path d={`M${x} 300l12 24-12 23M${x + 12} 300l-12 24 12 23`} />
            </g>
          );
        })}
      </g>

      {/* The front wall masks the conveyor end, leaving a precise inlet opening. */}
      <g strokeOpacity="0.87">
        <path
          d="M310 419V279L416 238L561 274V419Z"
          fill="var(--bg)"
          stroke="none"
        />
        <path
          d={`M310 419V279L416 238L${conveyorEntry.x} 274V${conveyorEntry.top}M${conveyorEntry.x} ${conveyorEntry.bottom}V419H310`}
        />
        <path
          d="M304 272L416 227L567 266L561 274L416 238L310 279Z"
          fill="var(--bg)"
        />
        <path d="M416 238V419M310 298H561M310 358H561" />
        <path d="M345 255.5V233H363V248.3M342 233H366" />
        <path d="M451 236V224H516V253" strokeWidth="0.75" />
        {[463, 476, 489, 502].map((x) => (
          <path
            key={x}
            d={`M${x} 224V${227 + ((x - 416) * 39) / 151}`}
            strokeWidth="0.65"
          />
        ))}
        {[326, 369].map((x) => (
          <FactoryWindow key={x} x={x} y={309} width={29} height={37} />
        ))}
        {[434, 475, 516].map((x) => (
          <FactoryWindow key={x} x={x} y={306} width={28} height={40} />
        ))}
        <LoadingDoor x={329} y={373} width={63} />
        <rect x="435" y="373" width="24" height="46" strokeWidth="0.8" />
        <path d="M440 398H443" strokeWidth="0.8" />
        <rect x="474" y="373" width="68" height="46" strokeWidth="0.8" />
        <path d="M508 373V419M474 389H542" strokeWidth="0.65" />
        <g strokeWidth="0.55" strokeOpacity="0.35">
          <path d="M324 285H347M354 278H377M439 271H461M475 279H497M520 287H542M318 365H340M365 365H388M430 365H452M478 365H500M526 365H550" />
        </g>
      </g>

      <g strokeOpacity="0.8">
        <path d="M758 410V197L799 176L871 193V410Z" fill="var(--bg)" />
        <polygon
          points="752,193 799,171 877,189 871,193 799,176 758,197"
          fill="var(--bg)"
        />
        <path d="M799 176V410M758 219H871M758 259H871M758 320H871M773 184.3V167H794V173.34M770 167H797" />
        {[769, 809, 839].map((x) => (
          <g key={x}>
            <rect x={x} y="229" width="20" height="19" strokeWidth="0.8" />
            <path
              d={`M${x + 10} 229V248`}
              strokeWidth="0.6"
              strokeOpacity="0.55"
            />
            <rect x={x} y="271" width="20" height="35" strokeWidth="0.8" />
            <path d={`M${x} 285h20`} strokeWidth="0.6" strokeOpacity="0.55" />
          </g>
        ))}
      </g>

      {/* One continuous sawtooth silhouette; every pane ends at its frame. */}
      <g strokeOpacity="0.86">
        <path
          d="M889 419V299L968 248V299L1047 248V299L1126 248V299L1205 248V299L1268 317V419Z"
          fill="var(--bg)"
        />
        <path d="M889 299H1205V419M1205 299L1268 317" />
        {[968, 1047, 1126, 1205].map((x) => (
          <g key={x} strokeWidth="0.7">
            <path d={`M${x - 51} 291L${x - 8} 263V291Z`} />
            {[15, 29].map((offset) => (
              <path
                key={offset}
                d={`M${x - 51 + offset} ${coordinate(291 - (offset * 28) / 43)}V291`}
              />
            ))}
          </g>
        ))}
        <rect x="906" y="334" width="282" height="22" strokeWidth="0.8" />
        <path d="M906 345H1188" strokeWidth="0.55" strokeOpacity="0.5" />
        {Array.from({ length: 13 }, (_, i) => (
          <path
            key={i}
            d={`M${906 + ((i + 1) * 282) / 14} 334V356`}
            strokeWidth="0.55"
            strokeOpacity="0.5"
          />
        ))}
        {[907, 981, 1055, 1129].map((x) => (
          <LoadingDoor key={x} x={x} y={367} width={58} />
        ))}
        <path
          d="M1218 338L1254 348V370L1218 360ZM1236 343V365M1218 349L1254 359"
          strokeWidth="0.65"
        />
      </g>

      {/* Tank farm: ladders are outside the vessels, with clear shared platforms. */}
      <g strokeOpacity="0.66">
        <Silo x={1311} top={191} width={65} bottom={369} base={398} />
        <Silo x={1385} top={218} width={57} bottom={369} base={398} />
        <path
          d="M1296 185H1384M1318 185V195.73M1369 185V195.73M1343.5 190.5V164H1413.5V217.5"
          strokeWidth="0.8"
        />
        <Railing x={1296} y={172} width={88} />
        <Ladder x={1296} top={185} bottom={398} />
        <path d="M1296 398H1450" />
      </g>
      <g strokeOpacity="0.55">
        {/* Rear guardrail follows the same ellipse as the tank rim, 16 units above it. */}
        <path d="M1485 292A66 14 0 0 1 1617 292" strokeWidth="0.65" />
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const angle = Math.PI * (1 + t);
          const x = coordinate(1551 + 66 * Math.cos(angle));
          const y = coordinate(308 + 14 * Math.sin(angle));
          return <path key={t} d={`M${x} ${y - 16}V${y}`} strokeWidth="0.6" />;
        })}
        <path
          d="M1485 308A66 14 0 0 1 1617 308V405A66 14 0 0 1 1485 405Z"
          fill="var(--bg)"
          stroke="none"
        />
        {/* Side edges meet the top ellipse without drawing its rear half twice. */}
        <path d="M1485 308V405A66 14 0 0 0 1617 405V308" />
        <ellipse cx="1551" cy="308" rx="66" ry="14" />
        <path
          d="M1485 342Q1551 367 1617 342M1485 379Q1551 404 1617 379"
          strokeWidth="0.65"
        />
        <Ladder x={1626} top={300} bottom={419} width={10} />
        <path d="M1617 308H1636" strokeWidth="0.65" />
      </g>

      {/* Simple foreground sheds mask the lower structure behind them. */}
      <g strokeOpacity="0.74">
        <path d="M-12 419V379L71 359L167 379V419Z" fill="var(--bg)" />
        <polygon
          points="-16,375 71,355 171,375 167,379 71,359 -12,379"
          fill="var(--bg)"
        />
        <path d="M71 359V419" />
        <rect x="9" y="389" width="23" height="25" strokeWidth="0.7" />
        <rect x="44" y="389" width="17" height="25" strokeWidth="0.7" />
        <LoadingDoor x={87} y={388} width={63} />

        {/* Straight-on annex: one flat facade and a horizontal roof cap. */}
        <rect x="552" y="352" width="101" height="67" fill="var(--bg)" />
        <rect x="548" y="347" width="109" height="5" fill="var(--bg)" />
        {[573, 613].map((x) => (
          <rect
            key={x}
            x={x}
            y="365"
            width="19"
            height="24"
            strokeWidth="0.7"
          />
        ))}
        <rect x="592" y="400" width="21" height="19" strokeWidth="0.7" />

        <rect x="653" y="366" width="87" height="53" fill="var(--bg)" />
        <rect x="649" y="361" width="95" height="5" fill="var(--bg)" />
        <rect x="667" y="378" width="58" height="17" strokeWidth="0.7" />
        {[681.5, 696, 710.5].map((x) => (
          <path key={x} d={`M${x} 378V395`} strokeWidth="0.6" />
        ))}

        <path d="M1638 419V363L1713 335L1817 365V419Z" fill="var(--bg)" />
        <polygon
          points="1633,359 1713,330 1822,361 1817,365 1713,335 1638,363"
          fill="var(--bg)"
        />
        <path d="M1713 335V419" />
        <LoadingDoor x={1654} y={379} width={42} />
        {[1728, 1770].map((x) => (
          <g key={x} strokeWidth="0.7">
            <rect x={x} y="373" width="28" height="23" />
            <path d={`M${x + 14} 373V396`} />
          </g>
        ))}
      </g>

      {/* Simple pipe runs: one overhead supply, supported between building openings. */}
      <g strokeOpacity="0.76">
        <path
          d="M210 419V332Q210 320 222 320H299V305H310V312H306V327H222Q217 327 217 332V419Z"
          fill="var(--bg)"
        />
        <path d="M234 419V359H310V366H241V419Z" fill="var(--bg)" />
        <path d="M250 317V330M280 317V330" strokeWidth="0.7" />
        <path d="M266 320V310M260 310H272" strokeWidth="0.75" />
        <circle cx="266" cy="324" r="3" fill="var(--bg)" />
        {/* Solid narrow columns hide lines behind them without crossing the loading doors. */}
        {[881, 1203].map((x) => (
          <g key={x}>
            <rect
              x={x}
              y="322"
              width="6"
              height="97"
              fill="var(--bg)"
              strokeWidth="0.8"
            />
            <path d={`M${x - 3} 419H${x + 9}`} strokeWidth="0.8" />
          </g>
        ))}
        <path
          d="M698 361V340Q698 332 706 332H765V326Q765 316 775 316H1261Q1271 316 1271 326V356H1485V362H1265V326Q1265 322 1261 322H775Q771 322 771 326V338H706Q704 338 704 340V361Z"
          fill="var(--bg)"
        />
        <path
          d="M851 313V325M1038 313V325M1190 313V325M1340 353V365M1472 353V365"
          strokeWidth="0.65"
        />
      </g>

      {/* Foreground equipment uses complete outlines with just the essential fittings. */}
      <g strokeOpacity="0.82">
        <path
          d="M1150 386H1211A16 16 0 0 1 1227 402A16 16 0 0 1 1211 418H1150A16 16 0 0 1 1134 402A16 16 0 0 1 1150 386Z"
          fill="var(--bg)"
        />
        <path
          d="M1150 386Q1140 402 1150 418M1211 386Q1221 402 1211 418M1165 386V418M1198 386V418M1174 386V378H1187V386"
          strokeWidth="0.7"
        />
        {/* The exchanger outlet reaches the pump inlet, rather than ending in space. */}
        <path
          d="M1227 399H1246Q1252 399 1252 405H1287V411H1252Q1246 411 1246 405H1227Z"
          fill="var(--bg)"
          strokeWidth="0.75"
        />
        <rect x="1287" y="398" width="30" height="21" fill="var(--bg)" />
        <circle cx="1302" cy="408" r="7" fill="var(--bg)" />
        <circle cx="1302" cy="408" r="2.5" />
        <path d="M1292 398V390H1312V398M1302 390V362" strokeWidth="0.75" />
        <rect
          x="1354"
          y="386"
          width="118"
          height="6"
          fill="var(--bg)"
          strokeWidth="0.8"
        />
        <path d="M1360 392V419M1466 392V419" strokeWidth="0.8" />
        <Railing x={1360} y={373} width={106} />
      </g>

      <path d="M0 419h1800" strokeOpacity="0.55" />
    </g>
  </svg>
);

export function FactoryPanorama() {
  return (
    <div className="factory-panorama" aria-hidden="true">
      {factoryDrawing}
    </div>
  );
}

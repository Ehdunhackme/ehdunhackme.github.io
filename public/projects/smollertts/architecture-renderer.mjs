// Shared, framework-free diagram for the article and standalone demo.
// All feature values are illustrative. This module never touches model inference.
const svgTags=new Set(['svg','g','defs','marker','path','text','circle','rect','line','clipPath','title','desc']);
function h(tag,props,...children) {
  if(typeof tag==='function') return tag({...props,children});
  const el=svgTags.has(tag)?document.createElementNS('http://www.w3.org/2000/svg',tag):document.createElement(tag);
  for(const [key,value] of Object.entries(props||{})) {
    if(key==='key'||value==null) continue;
    if(key==='style') {for(const [name,v] of Object.entries(value)) el.style.setProperty(name,String(v));continue;}
    const attr=key==='className'?'class':key==='tabIndex'?'tabindex':['viewBox','clipPathUnits','markerWidth','markerHeight','refX','refY','pathLength'].includes(key)?key:key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());
    el.setAttribute(attr,String(value));
  }
  for(const child of children.flat(Infinity)) if(child!=null&&typeof child!=='boolean') el.append(child instanceof Node?child:document.createTextNode(String(child)));
  return el;
}
const colors = [
    "var(--arch-pink)",
    "var(--arch-gold)",
    "var(--arch-green)",
    "var(--arch-blue)",
    "var(--arch-purple)",
    "var(--arch-teal)",
    "var(--arch-teal)"
];
const phones = [
    "h",
    "ə",
    "l",
    "oʊ"
];
// These durations and latent values illustrate the operations, not a live trace.
const repeats = [
    0,
    0,
    1,
    2,
    2,
    3,
    3,
    3,
    3
];
const phoneColors = [
    "var(--arch-pink)",
    "var(--arch-gold)",
    "var(--arch-blue)",
    "var(--arch-purple)"
];
const steps = [
    {
        title: "Text to phonemes",
        text: "Pronunciation maps words to phones and stress."
    },
    {
        title: "Text encoder",
        text: "Four blocks add context to each 160-wide phone vector."
    },
    {
        title: "Duration & length",
        text: "Predicted durations turn four phones into nine frames in this example."
    },
    {
        title: "Acoustic features",
        text: "Pitch, voicing and energy guide the frame decoder."
    },
    {
        title: "Mel spectrogram",
        text: "Each column represents one frame with 80 mel bands."
    },
    {
        title: "HiFi-GAN V2",
        text: "Upsampling by 8 × 8 × 2 × 2 gives 256 samples per frame."
    },
    {
        title: "Speech waveform",
        text: "A waveform with 22,050 samples per second."
    }
];
function feature(column, row) {
    return .12 + .8 * Math.abs(Math.sin(column * .73 + row * .88) * Math.cos(row * .27 - column * .11));
}
function Heatmap({ x, y, width, height, columns = 32, rows = 10 }) {
    return /*#__PURE__*/ h("g", {
        className: "sm-arch-heatmap",
        "aria-hidden": "true"
    }, Array.from({
        length: columns
    }, (_, col)=>/*#__PURE__*/ h("g", {
            key: col,
            className: "sm-arch-melColumn",
            style: {
                "--delay": `${col * 22}ms`
            }
        }, Array.from({
            length: rows
        }, (_, row)=>/*#__PURE__*/ h("rect", {
                key: row,
                x: x + col * width / columns,
                y: y + row * height / rows,
                width: width / columns - 1,
                height: height / rows - 1,
                fill: "currentColor",
                opacity: feature(col, row)
            })))));
}
function Wave({ peaks, x, y, width, height, clipId }) {
    const bars = peaks.map((peak, i)=>/*#__PURE__*/ h("line", {
            key: i,
            x1: x + (i + .5) * width / peaks.length,
            x2: x + (i + .5) * width / peaks.length,
            y1: y - Math.max(1, peak * height / 2),
            y2: y + Math.max(1, peak * height / 2)
        }));
    return /*#__PURE__*/ h("g", {
        "aria-hidden": "true"
    }, /*#__PURE__*/ h("defs", null, /*#__PURE__*/ h("clipPath", {
        id: clipId
    }, /*#__PURE__*/ h("rect", {
        className: "sm-arch-waveReveal",
        x: x,
        y: y - height / 2,
        width: width,
        height: height
    }))), /*#__PURE__*/ h("g", {
        className: "sm-arch-waveGhost"
    }, bars), /*#__PURE__*/ h("g", {
        className: "sm-arch-waveInk",
        clipPath: `url(#${clipId})`
    }, bars));
}
function Detail({ step, peaks, id }) {
    const arrow = {
        markerEnd: `url(#${id}-detail-arrow)`
    };
    return /*#__PURE__*/ h("svg", {
        className: "sm-arch-detailSvg",
        viewBox: "0 0 250 238",
        role: "img",
        "aria-label": `${steps[step].title} close-up`
    }, /*#__PURE__*/ h("defs", null, /*#__PURE__*/ h("marker", {
        id: `${id}-detail-arrow`,
        viewBox: "0 0 10 10",
        refX: "9",
        refY: "5",
        markerWidth: "6",
        markerHeight: "6",
        orient: "auto"
    }, /*#__PURE__*/ h("path", {
        d: "M1 1 9 5 1 9Z",
        fill: "currentColor"
    }))), step === 0 && /*#__PURE__*/ h("g", null, /*#__PURE__*/ h("text", {
        x: "125",
        y: "204",
        textAnchor: "middle",
        className: "sm-arch-exampleWord"
    }, "Hello."), /*#__PURE__*/ h("path", {
        d: "M125 175V126",
        className: "sm-arch-detailLine",
        ...arrow
    }), phones.map((p, i)=>/*#__PURE__*/ h("g", {
            key: p,
            style: {
                color: phoneColors[i]
            }
        }, /*#__PURE__*/ h("circle", {
            cx: 35 + i * 60,
            cy: "95",
            r: "23",
            className: "sm-arch-token"
        }), /*#__PURE__*/ h("text", {
            x: 35 + i * 60,
            y: "101",
            textAnchor: "middle"
        }, p))), /*#__PURE__*/ h("text", {
        x: "125",
        y: "35",
        textAnchor: "middle",
        className: "sm-arch-annotation"
    }, "Phonemes + stress")), step === 1 && /*#__PURE__*/ h("g", null, [
        0,
        1,
        2,
        3
    ].map((i)=>/*#__PURE__*/ h("g", {
            key: i
        }, [
            0,
            1,
            2,
            3
        ].map((j)=>/*#__PURE__*/ h("path", {
                key: j,
                d: `M${35 + i * 60} 169 Q${125 + (i - j) * 12} ${65 + Math.abs(i - j) * 13} ${35 + j * 60} 57`,
                className: "sm-arch-attentionLink",
                style: {
                    opacity: i === 1 || j === 1 ? .5 : .12
                }
            })), /*#__PURE__*/ h("circle", {
            cx: 35 + i * 60,
            cy: "190",
            r: "20",
            className: "sm-arch-token"
        }), /*#__PURE__*/ h("text", {
            x: 35 + i * 60,
            y: "196",
            textAnchor: "middle"
        }, phones[i]), Array.from({
            length: 7
        }, (_, j)=>/*#__PURE__*/ h("rect", {
                key: j,
                x: 23 + i * 60,
                y: 17 + j * 5,
                width: "24",
                height: "4",
                fill: phoneColors[i],
                opacity: feature(i, j)
            })))), /*#__PURE__*/ h("text", {
        x: "125",
        y: "125",
        textAnchor: "middle",
        className: "sm-arch-backedText"
    }, "Shared context")), step === 2 && /*#__PURE__*/ h("g", null, repeats.map((phone, i)=>/*#__PURE__*/ h("path", {
            key: i,
            d: `M${35 + phone * 60} 158 C${35 + phone * 60} 107 ${17 + i * 27} 113 ${17 + i * 27} 67`,
            className: "sm-arch-detailLine",
            style: {
                stroke: phoneColors[phone],
                opacity: .4
            }
        })), repeats.map((phone, i)=>/*#__PURE__*/ h("g", {
            key: i,
            style: {
                color: phoneColors[phone]
            }
        }, /*#__PURE__*/ h("rect", {
            x: 6 + i * 27,
            y: "42",
            width: "22",
            height: "25",
            rx: "2",
            className: "sm-arch-frameCell"
        }), /*#__PURE__*/ h("text", {
            x: 17 + i * 27,
            y: "59",
            textAnchor: "middle",
            className: "sm-arch-smallPhone"
        }, phones[phone]))), phones.map((p, i)=>/*#__PURE__*/ h("g", {
            key: p,
            style: {
                color: phoneColors[i]
            }
        }, /*#__PURE__*/ h("circle", {
            cx: 35 + i * 60,
            cy: "180",
            r: "22",
            className: "sm-arch-token"
        }), /*#__PURE__*/ h("text", {
            x: 35 + i * 60,
            y: "186",
            textAnchor: "middle"
        }, p), /*#__PURE__*/ h("text", {
            x: 35 + i * 60,
            y: "222",
            textAnchor: "middle",
            className: "sm-arch-annotation"
        }, "× ", [
            2,
            1,
            2,
            4
        ][i]))), /*#__PURE__*/ h("text", {
        x: "125",
        y: "21",
        textAnchor: "middle",
        className: "sm-arch-annotation"
    }, "Expanded sequence")), step === 3 && /*#__PURE__*/ h("g", null, /*#__PURE__*/ h("text", {
        x: "15",
        y: "25",
        className: "sm-arch-annotation"
    }, "Pitch"), /*#__PURE__*/ h("path", {
        d: "M82 25Q110 0 140 23T230 18",
        className: "sm-arch-prosodyCurve"
    }), /*#__PURE__*/ h("text", {
        x: "15",
        y: "67",
        className: "sm-arch-annotation"
    }, "Voicing"), /*#__PURE__*/ h("path", {
        d: "M82 67H102V49H171V67H195V49H230",
        className: "sm-arch-prosodyCurve"
    }), /*#__PURE__*/ h("text", {
        x: "15",
        y: "107",
        className: "sm-arch-annotation"
    }, "Energy"), [
        9,
        17,
        21,
        27,
        22,
        14,
        18,
        11,
        6,
        12,
        18,
        9
    ].map((h1, i)=>/*#__PURE__*/ h("rect", {
            key: i,
            x: 82 + i * 12,
            y: 111 - h1,
            width: "8",
            height: h1,
            fill: "currentColor",
            opacity: ".6"
        })), /*#__PURE__*/ h("path", {
        d: "M155 122V152M34 169H133M155 190V208",
        className: "sm-arch-detailLine",
        ...arrow
    }), /*#__PURE__*/ h("circle", {
        cx: "155",
        cy: "171",
        r: "18",
        className: "sm-arch-token"
    }), /*#__PURE__*/ h("path", {
        d: "M146 171H164M155 162V180",
        className: "sm-arch-prosodyCurve"
    }), /*#__PURE__*/ h("text", {
        x: "15",
        y: "153",
        className: "sm-arch-annotation"
    }, "Frames"), /*#__PURE__*/ h("text", {
        x: "155",
        y: "231",
        textAnchor: "middle",
        className: "sm-arch-annotation"
    }, "Frame decoder")), step === 4 && /*#__PURE__*/ h("g", null, /*#__PURE__*/ h(Heatmap, {
        x: 44,
        y: 28,
        width: 197,
        height: 155,
        columns: 22,
        rows: 16
    }), /*#__PURE__*/ h("path", {
        d: "M36 28V192H240",
        className: "sm-arch-detailLine"
    }), /*#__PURE__*/ h("text", {
        x: "18",
        y: "109",
        textAnchor: "middle",
        transform: "rotate(-90 18 109)",
        className: "sm-arch-annotation"
    }, "80 mel bands"), /*#__PURE__*/ h("text", {
        x: "135",
        y: "220",
        textAnchor: "middle",
        className: "sm-arch-annotation"
    }, "T audio frames"), /*#__PURE__*/ h("rect", {
        x: "120",
        y: "27",
        width: "10",
        height: "157",
        className: "sm-arch-columnFocus"
    })), step === 5 && /*#__PURE__*/ h("g", null, /*#__PURE__*/ h(Wave, {
        peaks: peaks,
        x: 20,
        y: 25,
        width: 210,
        height: 30,
        clipId: `${id}-zoom-wave`
    }), [
        0,
        1,
        2,
        3
    ].map((i)=>{
        const w = 218 - i * 28, y = 54 + i * 39;
        return /*#__PURE__*/ h("g", {
            key: i
        }, /*#__PURE__*/ h("path", {
            d: `M${125 - w / 2} ${y}H${125 + w / 2}L${125 + (w - 18) / 2} ${y + 25}H${125 - (w - 18) / 2}Z`,
            className: "sm-arch-moduleShape"
        }), /*#__PURE__*/ h("text", {
            x: "125",
            y: y + 17,
            textAnchor: "middle",
            className: "sm-arch-annotation"
        }, "× ", [
            2,
            2,
            8,
            8
        ][i]), i < 3 && /*#__PURE__*/ h("path", {
            d: `M125 ${y + 37}V${y + 27}`,
            className: "sm-arch-detailLine",
            ...arrow
        }));
    }), /*#__PURE__*/ h("text", {
        x: "125",
        y: "227",
        textAnchor: "middle",
        className: "sm-arch-annotation"
    }, "1 mel frame · 256 samples")), step === 6 && /*#__PURE__*/ h("g", null, /*#__PURE__*/ h(Wave, {
        peaks: peaks,
        x: 10,
        y: 85,
        width: 230,
        height: 80,
        clipId: `${id}-zoom-wave`
    }), /*#__PURE__*/ h("path", {
        d: "M10 151H240",
        className: "sm-arch-detailLine"
    }), Array.from({
        length: 17
    }, (_, i)=>/*#__PURE__*/ h("circle", {
            key: i,
            cx: 12 + i * 14,
            cy: 151 - 18 * Math.sin(i * .85),
            r: "2.5",
            fill: "currentColor"
        })), /*#__PURE__*/ h("text", {
        x: "125",
        y: "205",
        textAnchor: "middle",
        className: "sm-arch-annotation"
    }, "22,050 samples / second")));
}
function ArchitectureView({ peaks, id }) {
    const step = 0, running = false, playing = false, inspecting = false;
    function node(index, label, primary = true) {
        return {
            role: 'button',
            tabIndex: 0,
            'aria-label': label,
            'aria-pressed': index === 0,
            'data-active': index === 0,
            'data-stage-index': index,
            'data-primary': primary,
            className: "sm-arch-stage",
            style: {
                '--stage-color': colors[index]
            }
        };
    }
    const arrow = {
        markerEnd: `url(#${id}-arrow)`
    };
    const streams = [
        {
            step: 1,
            paths: [
                90,
                195,
                300,
                405
            ].map((x)=>`M${x} 673V648`)
        },
        {
            step: 2,
            paths: [
                ...[
                    90,
                    195,
                    300,
                    405
                ].map((x)=>`M${x} 537V497`),
                'M248 451V411'
            ]
        },
        {
            step: 3,
            paths: [
                'M248 382V339'
            ]
        },
        {
            step: 4,
            paths: [
                'M248 293V247'
            ]
        },
        {
            step: 5,
            paths: [
                'M248 182V143'
            ]
        },
        {
            step: 6,
            paths: [
                'M248 99V65'
            ]
        }
    ];
    return /*#__PURE__*/ h("section", {
        className: "sm-arch-visual",
        "aria-label": "Animated model architecture",
        "data-playing": playing,
        "data-inspecting": inspecting,
        "data-step": step,
        style: {
            "--active-color": colors[step]
        }
    }, /*#__PURE__*/ h("div", {
        className: "sm-arch-layout"
    }, /*#__PURE__*/ h("div", {
        className: "sm-arch-pipeline",
        role: "region",
        "aria-label": "Model data flow"
    }, /*#__PURE__*/ h("svg", {
        className: "sm-arch-pipelineSvg",
        viewBox: "0 0 640 790",
        role: "group",
        "aria-labelledby": `${id}-title`,
        "aria-describedby": `${id}-desc`
    }, /*#__PURE__*/ h("title", {
        id: `${id}-title`
    }, "From text to speech"), /*#__PURE__*/ h("desc", {
        id: `${id}-desc`
    }, "Read bottom to top. Text becomes phonemes, phonemes become contextual vectors, predicted durations expand them into frames, the frame decoder predicts mel features, and HiFi-GAN synthesizes audio. Features and durations are illustrative, not a live model trace. The animation explains parallel inference; it is not sequential token generation. Select a stage for a close-up."), /*#__PURE__*/ h("defs", null, /*#__PURE__*/ h("marker", {
        id: `${id}-arrow`,
        viewBox: "0 0 10 10",
        refX: "9",
        refY: "5",
        markerWidth: "6",
        markerHeight: "6",
        orient: "auto"
    }, /*#__PURE__*/ h("path", {
        d: "M1 1 9 5 1 9Z",
        fill: "var(--arch-arrow)"
    }))), streams.map((stream)=>/*#__PURE__*/ h("g", {
            key: stream.step,
            className: "sm-arch-stream", "data-stream-index": stream.step,
            "data-active": step === stream.step,
            style: {
                color: colors[stream.step]
            },
            "aria-hidden": "true"
        }, stream.paths.map((d)=>/*#__PURE__*/ h("g", {
                key: d
            }, /*#__PURE__*/ h("path", {
                d: d,
                className: "sm-arch-connection",
                ...arrow
            }), /*#__PURE__*/ h("path", {
                d: d,
                pathLength: "1",
                className: "sm-arch-flow"
            }))))), /*#__PURE__*/ h("path", {
        d: "M248 751V734M90 734H405",
        className: "sm-arch-connection"
    }), [
        90,
        195,
        300,
        405
    ].map((x)=>/*#__PURE__*/ h("path", {
            key: x,
            d: `M${x} 734V719`,
            className: "sm-arch-connection",
            ...arrow
        })), /*#__PURE__*/ h("g", node(0, 'Inspect text frontend'), /*#__PURE__*/ h("rect", {
        x: "43",
        y: "672",
        width: "550",
        height: "116",
        className: "sm-arch-hitArea"
    }), phones.map((phone, i)=>/*#__PURE__*/ h("g", {
            key: phone,
            className: "sm-arch-phone",
            style: {
                color: phoneColors[i],
                "--delay": `${i * 90}ms`
            }
        }, /*#__PURE__*/ h("circle", {
            cx: 90 + i * 105,
            cy: "695",
            r: "21",
            className: "sm-arch-token"
        }), /*#__PURE__*/ h("text", {
            x: 90 + i * 105,
            y: "702",
            textAnchor: "middle",
            className: "sm-arch-phoneText"
        }, phone))), /*#__PURE__*/ h("text", {
        x: "248",
        y: "778",
        textAnchor: "middle",
        className: "sm-arch-inputWord"
    }, "“Hello.”"), /*#__PURE__*/ h("text", {
        x: "485",
        y: "702",
        className: "sm-arch-annotation"
    }, "Phonemes")), /*#__PURE__*/ h("g", node(1, 'Inspect text encoder'), /*#__PURE__*/ h("rect", {
        x: "43",
        y: "537",
        width: "410",
        height: "110",
        className: "sm-arch-hitArea"
    }), /*#__PURE__*/ h("rect", {
        x: "43",
        y: "603",
        width: "410",
        height: "42",
        className: "sm-arch-moduleShape"
    }), /*#__PURE__*/ h("text", {
        x: "248",
        y: "630",
        textAnchor: "middle",
        className: "sm-arch-moduleLabel"
    }, "Text encoder"), phones.map((phone, i)=>/*#__PURE__*/ h("g", {
            key: phone
        }, /*#__PURE__*/ h("path", {
            d: `M${90 + i * 105} 602V568`,
            className: "sm-arch-connection",
            ...arrow
        }), /*#__PURE__*/ h("g", null, Array.from({
            length: 6
        }, (_, j)=>/*#__PURE__*/ h("rect", {
                key: j,
                x: 76 + i * 105,
                y: 540 + j * 4.2,
                width: "28",
                height: "3.3",
                fill: phoneColors[i],
                opacity: feature(i, j)
            })))))), /*#__PURE__*/ h("path", {
        d: "M419 553H541V535M541 490V473H456",
        className: "sm-arch-branch",
        ...arrow
    }), /*#__PURE__*/ h("g", node(2, 'Inspect duration predictor', false), /*#__PURE__*/ h("rect", {
        x: "480",
        y: "490",
        width: "122",
        height: "42",
        rx: "2",
        className: "sm-arch-moduleShape"
    }), /*#__PURE__*/ h("text", {
        x: "541",
        y: "517",
        textAnchor: "middle",
        className: "sm-arch-branchLabel"
    }, "Durations")), /*#__PURE__*/ h("g", node(2, 'Inspect length regulator'), /*#__PURE__*/ h("rect", {
        x: "43",
        y: "382",
        width: "410",
        height: "114",
        className: "sm-arch-hitArea"
    }), /*#__PURE__*/ h("path", {
        d: "M43 452H453L405 494H90Z",
        className: "sm-arch-moduleShape"
    }), /*#__PURE__*/ h("text", {
        x: "248",
        y: "479",
        textAnchor: "middle",
        className: "sm-arch-moduleLabel"
    }, "Length regulator"), repeats.map((phone, i)=>/*#__PURE__*/ h("g", {
            key: i,
            style: {
                color: phoneColors[phone]
            }
        }, /*#__PURE__*/ h("rect", {
            x: 47 + i * 45.5,
            y: "384",
            width: "38",
            height: "24",
            rx: "2",
            className: "sm-arch-frameCell"
        }), /*#__PURE__*/ h("text", {
            x: 66 + i * 45.5,
            y: "401",
            textAnchor: "middle",
            className: "sm-arch-smallPhone"
        }, phones[phone])))), /*#__PURE__*/ h("path", {
        d: "M419 553H622V315H605M480 315H456",
        className: "sm-arch-branch",
        ...arrow
    }), /*#__PURE__*/ h("g", node(3, 'Inspect prosody conditioning', false), /*#__PURE__*/ h("path", {
        d: "M480 290H602V338H480Z",
        className: "sm-arch-moduleShape"
    }), /*#__PURE__*/ h("path", {
        d: "M491 305Q510 290 528 304T591 302",
        className: "sm-arch-prosodyCurve"
    }), /*#__PURE__*/ h("text", {
        x: "541",
        y: "331",
        textAnchor: "middle",
        className: "sm-arch-branchLabel"
    }, "Prosody")), /*#__PURE__*/ h("g", node(3, 'Inspect acoustic decoder'), /*#__PURE__*/ h("path", {
        d: "M43 294H453V336H43Z",
        className: "sm-arch-moduleShape"
    }), /*#__PURE__*/ h("text", {
        x: "248",
        y: "321",
        textAnchor: "middle",
        className: "sm-arch-moduleLabel"
    }, "Frame decoder")), /*#__PURE__*/ h("g", node(4, 'Inspect mel spectrogram'), /*#__PURE__*/ h("rect", {
        x: "43",
        y: "182",
        width: "410",
        height: "64",
        className: "sm-arch-hitArea"
    }), /*#__PURE__*/ h(Heatmap, {
        x: 43,
        y: 184,
        width: 410,
        height: 60
    }), /*#__PURE__*/ h("text", {
        x: "481",
        y: "210",
        className: "sm-arch-annotation"
    }, "Mel spectrogram"), /*#__PURE__*/ h("text", {
        x: "481",
        y: "232",
        className: "sm-arch-annotation"
    }, "80 bands × T frames")), /*#__PURE__*/ h("g", node(5, 'Inspect HiFi-GAN vocoder'), /*#__PURE__*/ h("path", {
        d: "M25 100H471L453 140H43Z",
        className: "sm-arch-moduleShape"
    }), /*#__PURE__*/ h("text", {
        x: "248",
        y: "126",
        textAnchor: "middle",
        className: "sm-arch-moduleLabel"
    }, "HiFi-GAN V2"), /*#__PURE__*/ h("text", {
        x: "486",
        y: "126",
        className: "sm-arch-annotation"
    }, "× 256")), /*#__PURE__*/ h("g", node(6, 'Inspect speech waveform'), /*#__PURE__*/ h("rect", {
        x: "27",
        y: "10",
        width: "442",
        height: "53",
        className: "sm-arch-hitArea"
    }), /*#__PURE__*/ h(Wave, {
        peaks: peaks,
        x: 29,
        y: 38,
        width: 438,
        height: 46,
        clipId: `${id}-wave`
    }), /*#__PURE__*/ h("text", {
        x: "486",
        y: "43",
        className: "sm-arch-annotation"
    }, "22.05 kHz")))), /*#__PURE__*/ h("aside", {
        className: "sm-arch-closeup",
        "aria-label": "Stage close-up"
    }, /*#__PURE__*/ h("div", {
        className: "sm-arch-detailPanel"
    }, /*#__PURE__*/ h("svg", {
        className: "sm-arch-closeupArrow",
        viewBox: "0 0 28 24",
        "aria-hidden": "true"
    }, /*#__PURE__*/ h("path", {
        d: "M3 12H25M17 5L25 12 17 19",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round"
    })), /*#__PURE__*/ h("h3", null, steps[step].title), /*#__PURE__*/ h("div", {
        key: step,
        className: "sm-arch-detailGraphic"
    }, /*#__PURE__*/ h(Detail, {
        step: step,
        peaks: peaks,
        id: id
    })), /*#__PURE__*/ h("p", null, steps[step].text)))), /*#__PURE__*/ h("button", {
        type: "button",
        className: "sm-arch-toggle",
        "aria-label": running ? 'Pause animation' : 'Play animation',
        title: running ? 'Pause animation' : 'Play animation',
        "data-architecture-play": ""
    }, /*#__PURE__*/ h("svg", {
        viewBox: "0 0 20 20",
        width: "16",
        height: "16",
        "aria-hidden": "true"
    }, running ? /*#__PURE__*/ h("path", {
        d: "M6 4v12M14 4v12",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "1.7"
    }) : /*#__PURE__*/ h("path", {
        d: "m6 3 10 7-10 7Z",
        fill: "currentColor"
    }))));
}

let nextId=0;
export function mountArchitecture(host,peaks,{theme='dark'}={}) {
  const id='sm-architecture-'+(++nextId);
  const root=ArchitectureView({peaks,id});
  root.dataset.theme=theme;
  host.replaceChildren(root);
  const nodes=[...root.querySelectorAll('[data-stage-index]')];
  const panel=root.querySelector('.sm-arch-detailPanel');
  const detail=root.querySelector('.sm-arch-detailGraphic');
  const toggle=root.querySelector('[data-architecture-play]');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let step=0,running=false,visible=false,started=false,timer;
  function setStep(index) {
    step=index;
    root.dataset.step=String(step);
    root.style.setProperty('--active-color',colors[step]);
    for(const node of nodes) {
      const active=Number(node.dataset.stageIndex)===step;
      node.setAttribute('aria-pressed',String(active));node.dataset.active=String(active);
    }
    for(const stream of root.querySelectorAll('[data-stream-index]')) stream.dataset.active=String(Number(stream.dataset.streamIndex)===step);
    panel.querySelector('h3').textContent=steps[step].title;
    panel.querySelector('p').textContent=steps[step].text;
    detail.replaceChildren(Detail({step,peaks,id}));
  }
  function sync() {
    clearTimeout(timer);
    const playing=running&&visible&&!document.hidden;
    root.dataset.playing=String(playing);
    toggle.setAttribute('aria-label',running?'Pause animation':'Play animation');
    toggle.title=running?'Pause animation':'Play animation';
    toggle.querySelector('svg').replaceChildren(h('path',running?{d:'M6 4v12M14 4v12',fill:'none',stroke:'currentColor',strokeWidth:'1.7'}:{d:'m6 3 10 7-10 7Z',fill:'currentColor'}));
    if(playing) timer=setTimeout(()=>{setStep((step+1)%steps.length);sync();},3600);
  }
  function inspect(index) {started=true;running=false;root.dataset.inspecting='true';setStep(index);sync();}
  function click(event) {
    const node=event.target.closest('[data-stage-index]');
    if(node&&root.contains(node)) inspect(Number(node.dataset.stageIndex));
    else if(event.target.closest('[data-architecture-play]')) {started=true;root.dataset.inspecting='false';running=!running;sync();}
  }
  function keydown(event) {
    const node=event.target.closest('[data-stage-index]');
    if(!node) return;
    const index=Number(node.dataset.stageIndex);
    if(event.key==='Enter'||event.key===' ') {event.preventDefault();inspect(index);}
    if(['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'].includes(event.key)) {
      event.preventDefault();const next=(index+(['ArrowUp','ArrowRight'].includes(event.key)?1:6))%7;
      inspect(next);root.querySelector('[data-stage-index="'+next+'"][data-primary="true"]').focus();
    }
  }
  const observer=new IntersectionObserver(([entry])=>{
    visible=entry.isIntersecting;
    // Auto-start only once enough is on screen. An explicit Play must still
    // work when only part of this tall panel fits in the viewport.
    if(visible&&entry.intersectionRatio>=.45&&!started&&!reduced.matches) {started=true;running=true;}
    sync();
  },{threshold:[0,.45]});
  const motion=()=>{if(reduced.matches) running=false;sync();};
  root.addEventListener('click',click);root.addEventListener('keydown',keydown);
  document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',motion);observer.observe(root);
  sync();
  return {destroy(){clearTimeout(timer);observer.disconnect();root.removeEventListener('click',click);root.removeEventListener('keydown',keydown);document.removeEventListener('visibilitychange',sync);reduced.removeEventListener('change',motion);host.replaceChildren();}};
}

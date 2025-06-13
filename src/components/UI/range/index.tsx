import {getTrackBackground, Range} from "react-range";

interface RangeStepProps {
    step: number;
    min: number;
    max: number;
    values: number[];
    setValues: (value: number[]) => void;
    onChangeComplete: (value: number[]) => void;

}

const RangeStep = ({step,min,max,values,setValues,onChangeComplete}: RangeStepProps) => {
    return (
        <Range
            values={values}
            step={step}
            min={min}
            max={max}
            rtl={false}
            onChange={(values) => setValues(values)}
            onFinalChange={(vals) => onChangeComplete ? onChangeComplete(vals) : null}
            renderTrack={({props, children}) => (
                <div
                    onMouseDown={props.onMouseDown}
                    onTouchStart={props.onTouchStart}
                    style={{
                        ...props.style,
                        height: "56px",
                        display: "flex",
                        width: "100%",
                        padding: '0 24px',
                    }}
                >
                    <div
                        ref={props.ref}
                        style={{
                            height: "5px",
                            width: "100%",
                            borderRadius: "4px",
                            background: getTrackBackground({
                                values,
                                colors:values.length===2? ["var(--bgSecondary)","var(--core_Orange)","var(--bgSecondary)"]:["var(--core_Orange)","var(--bgSecondary)"],
                                min: min,
                                max: max,
                                rtl: false,
                            }),
                            alignSelf: "center",
                        }}
                    >
                        {children}
                    </div>
                </div>
            )}
            renderThumb={({props}) => (
                <div
                    {...props}
                    key={props.key}
                    style={{
                        ...props.style,
                        height: "32px",
                        width: "32px",
                        borderRadius: "16px",
                        backgroundColor: "#FFF",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        outline:'none',
                        boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.12), 0px 4px 12px 0px rgba(0, 0, 0, 0.12)"
                    }}
                >
                </div>
            )}
        />
    );
};

export default RangeStep;

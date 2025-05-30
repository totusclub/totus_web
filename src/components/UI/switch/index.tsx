

interface SwitchToggleProps {
    isOn: boolean;
    setIsOn: (value: boolean) => void;
}

const SwitchToggle = ({isOn,setIsOn}:SwitchToggleProps) => {
    const toggleSwitch = () => {
        setIsOn(!isOn);
    };

    return (
        <div
            onClick={toggleSwitch}
            style={{
                width: '48px',
                height: '32px',
                borderRadius: '24px',
                backgroundColor: isOn ? 'var(--core_Orange)' : 'var(--bgActive)',
                display: 'flex',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
            }}
        >
            <div
                style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '13px',
                    backgroundColor: 'var(--textPrimaryB)',
                    marginTop:'3px',
                    transform: isOn ? 'translateX(19px)' : 'translateX(3px)',
                    boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.12), 0px 4px 12px 0px rgba(0, 0, 0, 0.12)",
                    transition: 'transform 0.3s ease',
                }}
            />
        </div>
    );
};

export default SwitchToggle;

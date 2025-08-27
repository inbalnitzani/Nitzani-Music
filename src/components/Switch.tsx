import React from 'react';
import styled from 'styled-components';

type SwitchProps = {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  className?: string;
  disabled?: boolean;
  /** צבע מצב ON (מומלץ: 'var(--color-primary)') */
  onColor?: string;
  /** צבע מצב OFF של הכפתור (הכיתוב יהיה בצבע לבן) */
  offColor?: string;
  /** צבע שכבת הרקע במצב OFF */
  offLayerColor?: string;
  /** צבע שכבת הרקע במצב ON */
  onLayerColor?: string;
  trueLabel?: string;   // ברירת מחדל: YES
  falseLabel?: string;  // ברירת מחדל: NO
  size?: 'sm' | 'md';   // ברירת מחדל: md
};

const Switch: React.FC<SwitchProps> = ({
  id,
  checked,
  onChange,
  onClick,
  className,
  disabled = false,
  onColor = 'var(--color-primary)',
  offColor = '#f44336',
  offLayerColor = '#ebf7fc',
  onLayerColor = '#fcebeb',
  trueLabel = 'YES',
  falseLabel = 'NO',
  size = 'md',
}) => {
  const switchId = id ?? React.useId();

  return (
    <StyledWrapper
      className={className}
      $onColor={onColor}
      $offColor={offColor}
      $offLayerColor={offLayerColor}
      $onLayerColor={onLayerColor}
      $trueLabel={trueLabel}
      $falseLabel={falseLabel}
      $size={size}
      onClick={onClick}
    >
      <div className="button" onClick={(e) => e.stopPropagation()}>
        <input
          id={switchId}
          className="checkbox"
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          aria-checked={checked}
          aria-labelledby={`${switchId}-label`}
        />
        <div className="knobs" />
        <div className="layer" />
      </div>
    </StyledWrapper>
  );
};

export default Switch;

const StyledWrapper = styled.div<{
  $onColor: string;
  $offColor: string;
  $offLayerColor: string;
  $onLayerColor: string;
  $trueLabel: string;
  $falseLabel: string;
  $size: 'sm' | 'md';
}>`
  /* מידות: sm/md */
  --w: ${({ $size }) => ($size === 'sm' ? '48px' : '74px')};
  --h: ${({ $size }) => ($size === 'sm' ? '24px' : '36px')};
  --knob-size: ${({ $size }) => ($size === 'sm' ? '18px' : '28px')};
  --knob-top: ${({ $size }) => ($size === 'sm' ? '3px' : '4px')};
  --knob-left-on: ${({ $size }) => ($size === 'sm' ? '26px' : '42px')};
  --font-size: ${({ $size }) => ($size === 'sm' ? '9px' : '10px')};
  --pad-v: ${({ $size }) => ($size === 'sm' ? '6px' : '9px')};
  --pad-h: 4px;

  position: relative;
  display: inline-block;

  .button {
    position: relative;
    width: var(--w);
    height: var(--h);
    margin: 0 auto;
    border-radius: 999px;
    overflow: hidden;
  }

  .checkbox {
    position: absolute;
    inset: 0;
    opacity: 0;
    margin: 0;
    cursor: pointer;
    z-index: 3;
  }

  .knobs,
  .layer {
    position: absolute;
    inset: 0;
    border-radius: 999px;
  }

  .layer {
    background-color: ${({ $offLayerColor }) => $offLayerColor};
    transition: 0.3s ease all;
    z-index: 1;
  }

  .knobs {
    z-index: 2;
  }

  /* הכפתור (העיגול עם הטקסט) */
  .knobs::before {
    content: '${({ $trueLabel }) => $trueLabel}';
    position: absolute;
    top: var(--knob-top);
    left: 4px;
    width: var(--knob-size);
    height: calc(var(--knob-size) - 8px);
    padding: var(--pad-v) var(--pad-h);
    color: #fff;
    font-size: var(--font-size);
    font-weight: 700;
    text-align: center;
    line-height: 1;
    background-color: ${({ $onColor }) => $onColor};
    border-radius: 999px;
    transition: 0.3s ease all, left 0.3s cubic-bezier(0.18, 0.89, 0.35, 1.15);
  }

  /* לחיצה */
  .checkbox:active + .knobs::before {
    width: calc(var(--knob-size) + 18px);
    border-radius: 999px;
  }
  .checkbox:checked:active + .knobs::before {
    margin-left: -18px;
  }

  /* מצב CHECKED */
  .checkbox:checked + .knobs::before {
    content: '${({ $falseLabel }) => $falseLabel}';
    left: var(--knob-left-on);
    background-color: ${({ $offColor }) => $offColor};
  }

  .checkbox:checked ~ .layer {
    background-color: ${({ $onLayerColor }) => $onLayerColor};
  }

  /* מצב Disabled */
  .checkbox:disabled + .knobs::before {
    opacity: 0.6;
  }
  .checkbox:disabled {
    cursor: not-allowed;
  }
`;

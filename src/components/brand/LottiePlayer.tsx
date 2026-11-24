import { LottieSvg } from 'lottie-react';

interface LottiePlayerProps {
  data: object;
  className?: string;
}

export default function LottiePlayer({ data, className }: LottiePlayerProps) {
  return (
    <LottieSvg
      src={data}
      loop={false}
      autoplay
      rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
      className={className}
    />
  );
}

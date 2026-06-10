import { cardClasses } from "./styles";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

/** Superfície de conteúdo (painel/card) com raio e respiro padronizados. */
export function Card({ className = "", ...rest }: CardProps) {
  return <div className={cardClasses(className)} {...rest} />;
}

import "./loader.css";

interface Props {
  className?: string;
}

function classNames(...classes: Array<string>) {
  return classes.filter(Boolean).join(" ");
}

const Loader = ({ className }: Props) => {
  return <div className={classNames("loader", className ?? "")}></div>;
};

export default Loader;

interface Props {
  title: string;
  message: string;
  link?: string;
}

const InfoAlert = ({ title, message, link }: Props) => {
  return (
    <div className="rounded-md bg-emerald-200 p-4">
      <div className="flex">
        <div className="flex-shrink-0"></div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-emerald-800">{title}</h3>
          <div className="mt-2 text-sm text-emerald-700">
            <p>
              {message}{" "}
              {link ? (
                <a href={link} className="text-blue-500" target="_blank">
                  Link
                </a>
              ) : (
                ""
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoAlert;

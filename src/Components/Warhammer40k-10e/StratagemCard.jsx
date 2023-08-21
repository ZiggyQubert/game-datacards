import { ReactFitty } from "react-fitty";
import { MarkdownSpanDisplay } from "../MarkdownSpanDisplay";

export const StratagemCard = ({ stratagem, cardStyle, paddingTop = "32px", className }) => {
  return (
    <div
      className={className}
      style={{
        ...cardStyle,
        justifyContent: "center",
        justifyItems: "center",
        display: "flex",
        paddingTop: paddingTop,
      }}>
      <div className={`stratagem`}>
        <div className={`border`}>
          <div className="background-side-bar"></div>
          <div className="background-header-bar"></div>
          <div className="header">
            <ReactFitty maxSize={16} minSize={10}>
              {stratagem.name}
            </ReactFitty>
          </div>
          <div className="type">
            <ReactFitty maxSize={10} minSize={8}>
              {stratagem.detachment} - {stratagem.type}
            </ReactFitty>
          </div>
          <div className="content">
            {stratagem.when && (
              <div className="section">
                <span className="title">When:</span>
                <span className="text">
                  <MarkdownSpanDisplay content={stratagem.when} />
                </span>
              </div>
            )}
            {stratagem.target && (
              <div className="section">
                <span className="title">target:</span>
                <span className="text">
                  <MarkdownSpanDisplay content={stratagem.target} />
                </span>
              </div>
            )}
            {stratagem.effect && (
              <div className="section">
                <span className="title">effect:</span>
                <span className="text">
                  <MarkdownSpanDisplay content={stratagem.effect} />
                </span>
              </div>
            )}
            {stratagem.restrictions && (
              <div className="section">
                <span className="title">restrictions:</span>
                <span className="text">
                  <MarkdownSpanDisplay content={stratagem.restrictions} />
                </span>
              </div>
            )}
          </div>
          <div className="type-container"></div>
          <div className="cp-container">
            <div className="value">
              <ReactFitty maxSize={18} minSize={10}>
                {stratagem.cost} CP
              </ReactFitty>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

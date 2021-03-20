import React from "react";

export class Err404 extends React.Component {
  /*constructor(props) {
    super(props);
  }
  */

  render() {
    return (
      <div
        className="App"
        style={{
          alignContent: "center",
          background: "black",
          width: "100%",
          minHeight: "100vh",
        }}
      >
        <h1 style={{ color: "red" }}>RUTA NO VALIDA</h1>
      </div>
    );
  }
}

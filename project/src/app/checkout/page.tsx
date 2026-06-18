import React, { Suspense } from "react";
import CheckOutPagePageMain from "./PageMain";

const page = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckOutPagePageMain />
    </Suspense>
  );
};

export default page;

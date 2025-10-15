import React from 'react';

function ErrorPage({ statusCode }: { statusCode?: number }) {
  return (
    <div style={{ padding: 24 }}>
      <h1>Error{statusCode ? ` ${statusCode}` : ''}</h1>
      <p>Sorry, something went wrong.</p>
    </div>
  );
}

ErrorPage.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 500;
  return { statusCode };
};

export default ErrorPage;
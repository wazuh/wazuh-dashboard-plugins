export const htmlTemplate = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Wazuh dashboard email template</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body {
        background-color: #f6f6f6;
        font-family: 'Open Sans', 'Segoe UI', Tahoma, sans-serif;
        -webkit-font-smoothing: antialiased;
        font-size: 14px;
        line-height: 1.4;
        margin: 0;
        padding: 0;
        -ms-text-size-adjust: 100%;
        -webkit-text-size-adjust: 100%;
      }
      table {
        table-layout: fixed;
        border-collapse: separate;
        width: 100%;
      }
      table td {
        font-family: sans-serif;
        font-size: 14px;
        vertical-align: top;
      }
      .body {
        background-color: #f6f8f8;
        width: 100%;
      }
      .container {
        display: block;
        margin: 0 auto !important;
        padding: 10px;
        max-width: 1200px;
      }
      .content {
        box-sizing: border-box;
        display: block;
        margin: 0 auto;
        max-width: 100%;
      }
      #logo {
        float: right;
        max-width: 64px;
        height: auto;
      }
      .brand {
        width: 96%;
        padding: 20px 20px 20px;
        display: block;
        overflow: hidden;
        background-color: #006de4;
        border-top-right-radius: 5px;
        border-top-left-radius: 5px;
      }
      .main {
        font-family: 'Open Sans', 'Segoe UI', Tahoma, sans-serif;
        background-color: #fff;
        border: 1px solid #d3dae6;
        box-shadow: 0 2px 2px -1px rgba(152, 162, 179, 0.3),
          0 1px 5px -2px rgba(152, 162, 179, 0.3);
        border-radius: 6px;
        width: 100%;
        margin-bottom: 20px;
      }
      .wrapper {
        box-sizing: border-box;
        padding: 20px;
      }
      .content-block {
        padding-bottom: 10px;
        padding-top: 10px;
      }
      .footer {
        clear: both;
        margin-top: 10px;
        width: 100%;
      }
      .footer td,
      .footer p,
      .footer span,
      .footer a {
        color: #999999;
        font-size: 12px;
      }
      h1,
      h2,
      h3,
      h4 {
        color: #002a3a;
        font-family: 'Open Sans', 'Segoe UI', Tahoma, sans-serif;
        font-weight: 700;
        line-height: 1.4;
        margin: 0;
        margin-bottom: 20px;
      }
      .kpi {
        display: inline-block;
        margin-top: 20px;
        margin-bottom: 20px;
        padding: 20px;
        border-radius: 10px;
        background-color: #ffffff;
        border: 1px solid #d3dae6;
      }
      h1 {
        font-size: 32px;
        font-weight: 300;
        float: left;
        text-transform: capitalize;
        margin-bottom: 10px;
        margin-top: 8px;
        white-space: nowrap;
        color: #fff;
      }
      p,
      ul,
      ol,
      blockquote {
        font-family: 'Open Sans', 'Segoe UI', Tahoma, sans-serif;
        font-size: 14px;
        font-weight: normal;
        margin: 0;
        margin-bottom: 15px;
      }
      p li,
      ul li,
      ol li {
        list-style-position: inside;
        margin-left: 5px;
      }
      a {
        text-decoration: underline;
      }
      blockquote {
        border-left: 2px solid #a9a9a9;
        padding: 10px;
        background-color: #f6f6f6;
      }
      blockquote *:last-child {
        margin-bottom: 0;
      }
      .btn {
        box-sizing: border-box;
        width: auto;
        display: inline-block;
        margin-right: 1em;
      }
      .btn > tbody > tr > td {
        padding-bottom: 15px;
      }
      .btn table {
        width: auto;
      }
      .btn table td {
        background-color: #ffffff;
        border-radius: 5px;
        text-align: center;
      }
      .btn a {
        background-color: #ffffff;
        border: 1px solid;
        border-color: #005eb8 #00488c #00488c;
        border-radius: 5px;
        box-sizing: border-box;
        color: #ffffff;
        cursor: pointer;
        display: inline-block;
        font-size: 14px;
        font-weight: bold;
        margin: 0;
        padding: 12px 25px;
        text-decoration: none;
        text-transform: capitalize;
        text-shadow: rgba(0, 0, 0, 0.05) 0 1px 0;
      }
      .btn-primary table td {
        background-color: #005eb8;
        background-image: linear-gradient(180deg, #005eb8 0, #004381);
        color: #ffffff;
      }
      .btn-primary a {
        background-color: #005eb8;
        border-color: #005eb8 #00488c #00488c;
        background-image: linear-gradient(180deg, #005eb8 0, #004381);
        color: #ffffff;
      }
      .last {
        margin-bottom: 0;
      }
      .first {
        margin-top: 0;
      }
      .align-center {
        text-align: center;
      }
      .align-right {
        text-align: right;
      }
      .align-left {
        text-align: left;
      }
      .clear {
        clear: both;
      }
      .mt0 {
        margin-top: 0;
      }
      .mb0 {
        margin-bottom: 0;
      }
      .preheader {
        color: transparent;
        display: none;
        height: 0;
        max-height: 0;
        max-width: 0;
        opacity: 0;
        overflow: hidden;
        mso-hide: all;
        visibility: hidden;
        width: 0;
      }
      .powered-by a {
        text-decoration: none;
      }
      hr {
        border: 0;
        border-bottom: 1px solid #d3dae6;
        margin: 20px 0;
      }
      @media only screen and (max-width: 620px) {
        table[class='body'] h1 {
          font-size: 24px !important;
          margin-top: 16px !important;
          margin-bottom: 0px !important;
        }
        table[class='body'] p,
        table[class='body'] ul,
        table[class='body'] ol,
        table[class='body'] td,
        table[class='body'] span,
        table[class='body'] a {
          font-size: 16px !important;
        }
        table[class='body'] .wrapper,
        table[class='body'] .article {
          padding: 10px !important;
        }
        table[class='body'] .content {
          padding: 0 !important;
        }
        table[class='body'] .container {
          padding: 0 !important;
          width: 100% !important;
        }
        table[class='body'] .main {
          border-left-width: 0 !important;
          border-radius: 0 !important;
          border-right-width: 0 !important;
        }
        table[class='body'] .btn {
          display: table !important;
          margin-right: 0 !important;
          width: 100% !important;
          text-align: center !important;
        }
        table[class='body'] .btn table {
          width: 100% !important;
        }
        table[class='body'] .btn a {
          width: 100% !important;
        }
        table[class='body'] .img-responsive {
          height: auto !important;
          max-width: 100% !important;
          width: auto !important;
        }
      }
      @media all {
        .ExternalClass {
          width: 100%;
        }
        .ExternalClass,
        .ExternalClass p,
        .ExternalClass span,
        .ExternalClass font,
        .ExternalClass td,
        .ExternalClass div {
          line-height: 100%;
        }
        .apple-link a {
          color: inherit !important;
          font-family: inherit !important;
          font-size: inherit !important;
          font-weight: inherit !important;
          line-height: inherit !important;
          text-decoration: none !important;
        }
        #MessageViewBody a {
          color: inherit;
          text-decoration: none;
          font-size: inherit;
          font-family: inherit;
          font-weight: inherit;
          line-height: inherit;
        }
        .btn-primary table td:hover {
          background-color: #0a2694 !important;
          background-image: linear-gradient(
            180deg,
            #137cc1 0,
            #00529e
          ) !important;
        }
        .btn-primary a:hover {
          background-color: #0a2694 !important;
          background-image: linear-gradient(
            180deg,
            #137cc1 0,
            #00529e
          ) !important;
        }
      }
    </style>
  </head>
  <body>
    <span class="preheader"
      >A new Wazuh Dashboards report is available &nbsp; &nbsp; &nbsp; &nbsp;
      &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
      &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
      &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
      &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
      &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
      &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
      &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
    </span>
    <table
      role="presentation"
      border="0"
      cellpadding="0"
      cellspacing="0"
      class="body"
    >
      <tr>
        <td class="container">
          <div class="content">
            <!-- START CENTERED WHITE CONTAINER -->
            <table role="presentation" class="main">
              <!-- START MAIN CONTENT AREA -->
              <tr>
                <td class="wrapper">
                  <table
                    role="presentation"
                    border="0"
                    cellpadding="0"
                    cellspacing="0"
                  >
                    <tr>
                      <td class="brand">
                        <h1>Wazuh dashboards reports</h1>
                      </td>
                    </tr>
                    <tr>
                      <td class="kpi">
                        <h2>{{hits}}</h2>
                        <div>Alerts in the last 24 hours.</div>
                      </td>
                    </tr>
                    <tr>
                      <td class="wrapper">
                        <table
                          role="presentation"
                          border="0"
                          cellpadding="0"
                          cellspacing="0"
                        >
                          <tr>
                            <td>
                              <!-- Replace report details URL, report name, with the correct links  -->
                              <!-- CASE 1: There is a note -->
                              <p>
                                <a id="report_name" href="{{urlDefinition}}"
                                  >{{REPORT NAME}}</a
                                >
                                is now available in Wazuh Dashboards.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td align="left">
                        <table
                          role="presentation"
                          border="0"
                          cellpadding="0"
                          cellspacing="0"
                          class="btn btn-primary"
                        >
                          <tbody>
                            <tr>
                              <!-- Replace dashboard snapshot URL with the correct link  -->
                              <td>
                                <a
                                  id="open_in_reporting_button"
                                  href="{{urlDefinition}}"
                                  target="_blank"
                                  >Open in Wazuh Dashboards Reports</a
                                >
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td class="footer">
                        <p>
                          Is the ‘Open in Wazuh Dashboards Reports’ button not
                          working? Copy and paste this link into your browser:
                          <a href="{{urlDefinition}}">{{urlDefinition}}</a>
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td class="footer">
                        <p>
                          No longer want to receive this report? Please contact
                          the report sender or the administrator of your Wazuh.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

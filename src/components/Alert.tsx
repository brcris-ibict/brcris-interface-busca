/* eslint-disable @typescript-eslint/no-explicit-any */
/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable react-hooks/exhaustive-deps */
import { useRouter } from "next/router";
import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";

import { AlertType, alertService } from "../services/AlertService";

export { Alert };

Alert.propTypes = {
  id: PropTypes.string,
  fade: PropTypes.bool,
};

Alert.defaultProps = {
  id: "default-alert",
  fade: true,
};

function Alert({ id, fade }: any) {
  const mounted = useRef(false);
  const router = useRouter();
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    mounted.current = true;

    // subscribe to new alert notifications
    const subscription = alertService.onAlert(id).subscribe((alert: any) => {
      // clear alerts when an empty alert is received
      if (!alert.message) {
        setAlerts((alerts) => {
          // filter out alerts without 'keepAfterRouteChange' flag
          // @ts-expect-error
          const filteredAlerts = alerts.filter((x) => x.keepAfterRouteChange);

          // remove 'keepAfterRouteChange' flag on the rest
          return omit(filteredAlerts, "keepAfterRouteChange");
        });
      } else {
        // add alert to array with unique id
        alert.itemId = Math.random();
        // @ts-expect-error
        setAlerts((alerts) => [...alerts, alert]);

        // auto close alert if required
        if (alert.autoClose) {
          setTimeout(() => removeAlert(alert), 5000);
        }
      }
    });

    // clear alerts on location change
    const clearAlerts = () => alertService.clear(id);
    router.events.on("routeChangeStart", clearAlerts);

    // clean up function that runs when the component unmounts
    return () => {
      mounted.current = false;

      // unsubscribe to avoid memory leaks
      subscription.unsubscribe();
      router.events.off("routeChangeStart", clearAlerts);
    };
  }, []);

  function omit(arr: any, key: any) {
    return arr.map((obj: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [key]: omitted, ...rest } = obj;
      return rest;
    });
  }

  function removeAlert(alert: any) {
    if (!mounted.current) return;

    if (fade) {
      // fade out alert
      setAlerts((alerts: any) =>
        alerts.map((x: any) =>
          x.itemId === alert.itemId ? { ...x, fade: true } : x,
        ),
      );

      // remove alert after faded out
      setTimeout(() => {
        // @ts-expect-error
        setAlerts((alerts) => alerts.filter((x) => x.itemId !== alert.itemId));
      }, 250);
    } else {
      // remove alert
      // @ts-expect-error
      setAlerts((alerts) => alerts.filter((x) => x.itemId !== alert.itemId));
    }
  }

  function cssClasses(alert: any) {
    if (!alert) return;

    const classes = ["alert", "alert-dismissible"];

    const alertTypeClass = {
      [AlertType.Success]: "alert-success",
      [AlertType.Error]: "alert-danger",
      [AlertType.Info]: "alert-info",
      [AlertType.Warning]: "alert-warning",
    };

    classes.push(alertTypeClass[alert.type]);

    if (alert.fade) {
      classes.push("fade");
    }

    return classes.join(" ");
  }

  if (!alerts.length) return null;

  type Alert = {
    message: string;
  };

  return (
    <div className="alert-container">
      {alerts.map((alert: Alert) => (
        <div key={alert.message} className={cssClasses(alert)}>
          <div dangerouslySetInnerHTML={{ __html: alert.message }}></div>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="alert"
            aria-label="Close"
          ></button>
        </div>
      ))}
    </div>
  );
}

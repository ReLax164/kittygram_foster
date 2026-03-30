import React from "react";
import { Link } from "react-router-dom";

import {
  formatDisplayDate,
  ownershipStatusLabels,
} from "../../utils/constants";
import defaultImg from "../../images/default-kitty.jpg";

import styles from "./main-card.module.css";

export const MainCard = ({
  cardId,
  name = "",
  date = "",
  color = "white",
  ownershipStatus = "home",
  activeFosterContract = null,
  img,
  extraClass = "",
}) => {
  const colorText =
    color === "black" ||
    color === "saddlebrown" ||
    color === "gray" ||
    color === "darkgray"
      ? "white"
      : "primary";

  const statusLabel = ownershipStatusLabels[ownershipStatus] || "Не указан";
  const statusClass =
    ownershipStatus === "foster" ? styles.status_foster : styles.status_home;

  return (
    <article className={`${styles.content} ${extraClass}`}>
      <Link className={styles.link} to={`/cats/${cardId}`}>
        <img className={styles.img} src={img ?? defaultImg} alt="Фото котика." />
      </Link>
      <div className={styles.data_box}>
        <div className={styles.name_n_date_box}>
          <p
            className={`text text_type_h3 text_color_primary mt-8 mb-3 ${styles.name}`}
          >
            {name}
          </p>
          <p
            className={`text text_type_medium-20 text_color_secondary mb-8 ${styles.date}`}
          >
            {date}
          </p>
        </div>
        <div className={styles.cat_color_box} style={{ backgroundColor: color }}>
          <p
            className={`text text_type_medium-20 text_color_${colorText} ${styles.cat_color}`}
          >
            {color}
          </p>
        </div>
        <div className={`${styles.status_badge} ${statusClass}`}>
          <p className={`text text_type_medium-16 ${styles.status_text}`}>
            {statusLabel}
          </p>
        </div>
        {activeFosterContract && (
          <p className={`text text_type_medium-16 text_color_secondary ${styles.contract}`}>
            {formatDisplayDate(activeFosterContract.start_date)} - {formatDisplayDate(activeFosterContract.end_date)}
          </p>
        )}
      </div>
    </article>
  );
};

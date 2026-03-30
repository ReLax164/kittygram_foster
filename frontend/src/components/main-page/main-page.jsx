import React from "react";

import { getCards, getFosterCards } from "../../utils/api";

import { MainCard } from "../main-card/main-card";
import { PaginationBox } from "../pagination-box/pagination-box";

import styles from "./main-page.module.css";

export const MainPage = ({ queryPage, setQueryPage, extraClass = "" }) => {
  const [cards, setCards] = React.useState([]);
  const [pagData, setPagData] = React.useState({});
  const [mode, setMode] = React.useState("all");

  React.useEffect(() => {
    const loader = mode === "foster" ? getFosterCards : getCards;

    loader(queryPage)
      .then((res) => {
        setPagData({
          count: res.count,
          pages: Math.ceil(res.count / 10),
        });
        setCards(res.results);
      })
      .catch((err) => {
        if (err.detail === "Invalid page.") {
          loader(queryPage - 1)
            .then((res) => {
              setQueryPage(queryPage - 1);
              setPagData({
                count: res.count,
                pages: Math.ceil(res.count / 10),
              });
              setCards(res.results);
            })
            .catch((innerErr) => {
              console.error(innerErr);
            });
        } else {
          console.error(err);
        }
      });
  }, [mode, queryPage, setQueryPage]);

  const switchMode = (nextMode) => {
    setQueryPage(1);
    setMode(nextMode);
  };

  return (
    <section className={`${styles.content} ${extraClass}`}>
      <h2
        className={`text text_type_h2 text_color_primary mt-25 mb-20 ${styles.title}`}
      >
        {mode === "foster" ? "Коты на передержке" : "Замечательные коты"}
      </h2>

      <div className={styles.filters}>
        <button
          type="button"
          className={`${styles.filter_btn} ${mode === "all" ? styles.filter_btn_active : ""}`}
          onClick={() => switchMode("all")}
        >
          Все коты
        </button>
        <button
          type="button"
          className={`${styles.filter_btn} ${mode === "foster" ? styles.filter_btn_active : ""}`}
          onClick={() => switchMode("foster")}
        >
          На передержке
        </button>
      </div>

      <div className={styles.box}>
        {cards.map((item, index) => {
          return (
            <MainCard
              cardId={item.id}
              key={index}
              img={item.image_url}
              name={item.name}
              date={item.birth_year}
              color={item.color}
              ownershipStatus={item.ownership_status}
              activeFosterContract={item.active_foster_contract}
            />
          );
        })}
      </div>
      {pagData.count > 10 && (
        <PaginationBox
          data={pagData}
          queryPage={queryPage}
          setQueryPage={setQueryPage}
        />
      )}
    </section>
  );
};

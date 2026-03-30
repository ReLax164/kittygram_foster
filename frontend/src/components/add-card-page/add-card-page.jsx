import React from "react";
import { useHistory } from "react-router-dom";

import { sendCard } from "../../utils/api";
import {
  colorsList,
  getBase64,
  ownershipStatusLabels,
} from "../../utils/constants";

import returnIcon from "../../images/left.svg";
import addImgIcon from "../../images/image.svg";

import { ButtonForm } from "../ui/button-form/button-form";
import { Select } from "../ui/select/select";
import { ButtonSecondary } from "../ui/button-secondary/button-secondary";
import { Input } from "../ui/input/input";
import { ColorsBox } from "../ui/colors-box/colors-box";

import styles from "./add-card-page.module.css";

const getFirstError = (res) => {
  if (!res || typeof res !== "object") {
    return "Не удалось сохранить изменения.";
  }
  const value = Object.values(res)[0];
  if (Array.isArray(value)) {
    return value[0];
  }
  if (typeof value === "string") {
    return value;
  }
  return "Не удалось сохранить изменения.";
};

export const AddCardPage = ({ extraClass = "" }) => {
  const [currentColor, setCurrentColor] = React.useState("#FFFFFF");
  const [currentFileName, setCurrentFileName] = React.useState("");
  const [card, setCard] = React.useState({
    color: currentColor,
    achievements: [],
  });
  const [ownershipStatus, setOwnershipStatus] = React.useState("home");
  const [fosterDates, setFosterDates] = React.useState({
    start_date: "",
    end_date: "",
  });
  const [errorName, setErrorName] = React.useState("");
  const [errorAge, setErrorAge] = React.useState("");
  const [errorDates, setErrorDates] = React.useState("");
  const [formError, setFormError] = React.useState("");

  const history = useHistory();

  const handleReturn = () => {
    history.goBack();
  };

  const onChangeInput = (e) => {
    setCard({
      ...card,
      [e.target.name]: e.target.value,
    });
    if (e.target.name === "image") {
      setCurrentFileName(e.target.value);
    }
  };

  const onChangeStatus = (e) => {
    setOwnershipStatus(e.target.value);
    setFormError("");
    if (e.target.value === "home") {
      setErrorDates("");
    }
  };

  const onChangeFosterDate = (e) => {
    setFosterDates({
      ...fosterDates,
      [e.target.name]: e.target.value,
    });
    setErrorDates("");
  };

  const handleResponse = (res) => {
    if (typeof res.name === "object") {
      setErrorName("Поле с именем является обязательным.");
    } else if (typeof res.birth_year === "object") {
      setErrorAge("Поле с годом рождения является обязательным.");
    } else {
      setFormError(getFirstError(res));
    }
  };

  const handleSubmit = () => {
    if (
      ownershipStatus === "foster" &&
      (!fosterDates.start_date || !fosterDates.end_date)
    ) {
      setErrorDates("Для передержки нужно указать даты договора.");
      return;
    }

    if (errorAge) setErrorAge("");
    if (errorName) setErrorName("");
    if (errorDates) setErrorDates("");
    if (formError) setFormError("");

    const photo = document.querySelector('input[type="file"]').files[0];
    const payload = {
      ...card,
      ownership_status_value: ownershipStatus,
    };

    if (ownershipStatus === "foster") {
      payload.foster_start_date = fosterDates.start_date;
      payload.foster_end_date = fosterDates.end_date;
    }

    const onCardCreated = (res) => {
      if (res && res.id) {
        history.push(`/cats/${res.id}`);
      }
    };

    if (photo) {
      getBase64(photo).then((data) => {
        const cardWithImage = { ...payload, image: data };
        sendCard(cardWithImage).then(onCardCreated).catch(handleResponse);
      });
    } else {
      sendCard(payload).then(onCardCreated).catch(handleResponse);
    }
  };

  return (
    <div className={`${styles.content} ${extraClass}`}>
      <h2 className="text text_type_h2 text_color_primary mt-25 mb-9">
        Новый кот
      </h2>
      <ButtonSecondary
        extraClass={styles.return_btn_mobile}
        icon={returnIcon}
        onClick={handleReturn}
      />
      <div className={styles.container}>
        <label htmlFor="image" className={styles.img_box}>
          <img
            className={styles.img}
            src={addImgIcon}
            alt="Добавить фото котика."
          />
          <p className="text text_type_medium-16 text_color_primary">
            {currentFileName ? currentFileName : "Загрузите фото в формате JPG"}
          </p>
        </label>
        <input
          type="file"
          className={styles.file_input}
          name="image"
          id="image"
          onChange={onChangeInput}
        />
        <Input
          onChange={onChangeInput}
          name="name"
          type="text"
          placeholder="Имя кота"
          error={errorName}
        />
        <Input
          onChange={onChangeInput}
          name="birth_year"
          type="text"
          placeholder="Год рождения"
          error={errorAge}
        />
        <ColorsBox
          colorsList={colorsList}
          currentColor={currentColor}
          setCurrentColor={setCurrentColor}
          card={card}
          setCard={setCard}
        />
        <Select card={card} setCard={setCard} />

        <div className={styles.status_box}>
          <p
            className={`text text_type_medium-16 text_color_primary ${styles.section_label}`}
          >
            Статус владения
          </p>
          <select
            className={styles.status_select}
            value={ownershipStatus}
            onChange={onChangeStatus}
          >
            {Object.entries(ownershipStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {ownershipStatus === "foster" && (
          <div className={styles.contract_box}>
            <p
              className={`text text_type_medium-16 text_color_primary ${styles.section_label}`}
            >
              Договор передержки
            </p>
            <Input
              onChange={onChangeFosterDate}
              name="start_date"
              type="date"
              value={fosterDates.start_date}
            />
            <Input
              onChange={onChangeFosterDate}
              name="end_date"
              type="date"
              value={fosterDates.end_date}
              error={errorDates}
            />
          </div>
        )}

        {formError && (
          <p
            className={`text text_type_medium-16 text_color_red ${styles.form_error}`}
          >
            {formError}
          </p>
        )}

        <ButtonForm
          extraClass={styles.submit_btn}
          text="Сохранить"
          onClick={handleSubmit}
        />
        <ButtonSecondary
          extraClass={styles.return_btn}
          icon={returnIcon}
          onClick={handleReturn}
        />
      </div>
    </div>
  );
};

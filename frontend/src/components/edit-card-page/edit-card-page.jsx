import React from "react";
import { useHistory } from "react-router-dom";

import { updateCard } from "../../utils/api";
import {
  colorsList,
  colorsNames,
  formatAchievementsText,
  getBase64,
  ownershipStatusLabels,
} from "../../utils/constants";

import returnIcon from "../../images/left.svg";
import addImgIcon from "../../images/image.svg";
import removeIcon from "../../images/trash.svg";

import { ButtonSecondary } from "../ui/button-secondary/button-secondary";
import { Input } from "../ui/input/input";
import { ButtonForm } from "../ui/button-form/button-form";
import { Select } from "../ui/select/select";
import { ColorsBox } from "../ui/colors-box/colors-box";

import styles from "./edit-card-page.module.css";

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

export const EditCardPage = ({ data, setData, extraClass = "" }) => {
  const [currentColor, setCurrentColor] = React.useState("#FFFFFF");
  const [card, setCard] = React.useState({});
  const [achievements, setAchievements] = React.useState("");
  const [currentFileName, setCurrentFileName] = React.useState("");
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

  React.useEffect(() => {
    if (data.id) {
      setCard(data);
      setCurrentColor(colorsNames[data.color]);
      setOwnershipStatus(data.ownership_status || "home");
      setFosterDates({
        start_date: data.active_foster_contract?.start_date || "",
        end_date: data.active_foster_contract?.end_date || "",
      });

      let resultString = "";
      data.achievements.forEach((item) => {
        resultString
          ? (resultString += `, ${item.achievement_name}`)
          : (resultString = item.achievement_name);
      });
      setAchievements(formatAchievementsText(resultString));
    }
  }, [data, setData]);

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

  const handleReturn = () => {
    history.goBack();
  };

  const handleRemoveImg = () => {
    setCard({ ...card, image: null });
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

    const totalCard = {};
    const photo = document.querySelector('input[type="file"]').files[0];

    if (data.name !== card.name) {
      totalCard.name = card.name;
    }
    if (data.color !== card.color) {
      totalCard.color = card.color;
    }
    if (data.birth_year !== card.birth_year) {
      totalCard.birth_year = card.birth_year;
    }
    if (data.image !== card.image && card.image === null) {
      totalCard.image = card.image;
    }
    if (JSON.stringify(data.achievements) !== JSON.stringify(card.achievements)) {
      totalCard.achievements = card.achievements;
    }

    totalCard.ownership_status_value = ownershipStatus;
    if (ownershipStatus === "foster") {
      totalCard.foster_start_date = fosterDates.start_date;
      totalCard.foster_end_date = fosterDates.end_date;
    }

    const finalize = () => {
      history.replace({ pathname: `/cats/${card.id}` });
    };

    if (photo) {
      getBase64(photo).then((imageData) => {
        totalCard.image = imageData;
        updateCard(totalCard, card.id).then(finalize).catch(handleResponse);
      });
    } else {
      updateCard(totalCard, card.id).then(finalize).catch(handleResponse);
    }
  };

  return (
    <div className={`${styles.content} ${extraClass}`}>
      <h2 className="text text_type_h2 text_color_primary mt-25 mb-9">
        Редактировать кота
      </h2>
      <ButtonSecondary
        extraClass={styles.return_btn_mobile}
        icon={returnIcon}
        onClick={handleReturn}
      />
      <div className={styles.container}>
        {!currentFileName && card.image ? (
          <div className={styles.img_box}>
            <img className={styles.current_img} src={card.image_url} alt="Фото котика." />
            <ButtonSecondary
              extraClass={styles.remove_btn}
              icon={removeIcon}
              onClick={handleRemoveImg}
            />
          </div>
        ) : (
          <label htmlFor="image" className={styles.img_box}>
            <img className={styles.img} src={addImgIcon} alt="Добавить фото котика." />
            <p className="text text_type_medium-16 text_color_primary">
              {currentFileName ? currentFileName : "Загрузите фото в формате JPG"}
            </p>
          </label>
        )}
        <input
          type="file"
          className={styles.file_input}
          name="image"
          id="image"
          onChange={onChangeInput}
        />
        <Input
          type="text"
          placeholder="Имя кота"
          name="name"
          defaultValue={card.name}
          onChange={onChangeInput}
          error={errorName}
        />
        <Input
          type="text"
          placeholder="Год рождения"
          name="birth_year"
          defaultValue={card.birth_year}
          onChange={onChangeInput}
          error={errorAge}
        />
        <ColorsBox
          colorsList={colorsList}
          currentColor={currentColor}
          setCurrentColor={setCurrentColor}
          card={card}
          setCard={setCard}
        />
        <Select card={card} setCard={setCard} userAchievements={achievements} />

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

/** Opens the user's own Drive copies. The app does not store the exam text. */

export type Booklet = {
  year: string;
  questionsLabel: string;
  questionsHref: string;
  answersLabel: string | null;
  answersHref: string | null;
  note: string;
};

export const booklets: Booklet[] = [
  {
    year: "2016",
    questionsLabel: "Study book",
    questionsHref: "https://drive.google.com/file/d/1P62mlTjyqU5nOOqeE871p_pFxHit1t7x/view",
    answersLabel: null,
    answersHref: null,
    note: "Questions and discussion are in one book.",
  },
  {
    year: "2017",
    questionsLabel: "Closed book",
    questionsHref: "https://drive.google.com/file/d/17ks3EysJ9q3ltE43p3GXESMs39XhsUYJ/view",
    answersLabel: "Answers",
    answersHref: "https://drive.google.com/file/d/1ZH7JFiDK-wjba5fkuk1gTSmBb7YI_iL4/view",
    note: "Sit the closed book, then open the answer file.",
  },
  {
    year: "2018",
    questionsLabel: "Closed book",
    questionsHref: "https://drive.google.com/file/d/1g6M5NnA10Lq6n0dcDuuRZmSDgnNb5m2b/view",
    answersLabel: "Answers",
    answersHref: "https://drive.google.com/file/d/1d25-EzzAOBb6u1KTlN9pIIKl0BzhmVsn/view",
    note: "Sit the closed book, then open the answer file.",
  },
  {
    year: "2019",
    questionsLabel: "SASP file",
    questionsHref: "https://drive.google.com/file/d/1O1JJCBVY7Cr8wDz5pTHIhIibwDnIwwAK/view",
    answersLabel: null,
    answersHref: null,
    note: "Single combined file in your Drive.",
  },
  {
    year: "2020",
    questionsLabel: "Questions",
    questionsHref: "https://drive.google.com/file/d/16AdJi4ILCtViRttSZtnLJpAVNp1IFk7-/view",
    answersLabel: "Answers",
    answersHref: "https://drive.google.com/file/d/1uImmqnDf_2gDEr-718G3EK2S8MO25Oar/view",
    note: "Separate question and answer files.",
  },
  {
    year: "2021",
    questionsLabel: "SASP file",
    questionsHref: "https://drive.google.com/file/d/1KNCr0h7c743HNWn9YvKoxIogiGE8ERer/view",
    answersLabel: null,
    answersHref: null,
    note: "Single file in your Drive.",
  },
  {
    year: "2022",
    questionsLabel: "Part 1 questions",
    questionsHref: "https://drive.google.com/file/d/1O_pUKtS-_0y4DZxM5iviXh6nHUKkahzk/view",
    answersLabel: "Part 2 study booklet",
    answersHref: "https://drive.google.com/file/d/1a4G5WXRpVeF5cG_Sy3fTNWBz7jUu3Hl6/view",
    note: "Part 2 is the answer and discussion booklet.",
  },
  {
    year: "2023",
    questionsLabel: "Part 1 questions",
    questionsHref: "https://drive.google.com/file/d/1_qUTxWAP1cCpnN05ECx70JHLCKH2iJxp/view",
    answersLabel: "Part 2 study booklet",
    answersHref: "https://drive.google.com/file/d/1EqJqdf7sMbghkHZTj2IL1uBdXEXeNhYk/view",
    note: "Part 2 is the answer and discussion booklet.",
  },
];

export const notesRoot = "https://drive.google.com/drive/folders/17o1G6WGVLoU8xlAPoXHF6tNYMpa7PiXk";
export const uploadsRoot = "https://drive.google.com/drive/folders/1yS7USmpI4DjjfLIYVezglp6O6LzmlNKB";

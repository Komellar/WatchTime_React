import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import {
  addEpisodeToDB,
  addSeasonToDB,
  removeEpisodeFromDB,
} from '../../../../store/shows-actions';
import { useSelector } from 'react-redux';
import * as S from './EpisodesTabStyled';

const EpisodesTab = ({ seasons, show }) => {
  const [pickedSeason, setPickedSeason] = useState(1);
  const [seasonsOpen, setSeasonsOpen] = useState(false);
  const [watchedEpisodes, setWatchedEpisodes] = useState([]);
  const [episodesInSeason, setEpisodesInSeason] = useState(0);

  let watchedStats = `Watched ${watchedEpisodes.length} out of ${episodesInSeason} episodes`;
  let userId = useSelector((state) => state.auth.userId);

  const toggleSeasons = () => setSeasonsOpen(!seasonsOpen);

  const changeSeasonHandler = (newSeason) => {
    setPickedSeason(newSeason);
    setSeasonsOpen(false);
  };

  const pickEpisodeHandler = (userId, show, episode) => {
    if (!watchedEpisodes.includes(episode.id)) {
      addEpisodeToDB(userId, show, episode);
      let tempWatchedEpisodes = [...watchedEpisodes];
      tempWatchedEpisodes.push(episode.id);
      setWatchedEpisodes(tempWatchedEpisodes);
    } else {
      removeEpisodeFromDB(userId, show, episode);
      let tempWatchedEpisodes = watchedEpisodes.filter((id) => {
        return id !== episode.id;
      });
      setWatchedEpisodes(tempWatchedEpisodes);
    }
  };

  const addAllEpisodesHandler = (season) => {
    let unseenEpisodes = season.filter(
      (episode) => !watchedEpisodes.includes(episode.id)
    );
    addSeasonToDB(userId, show, unseenEpisodes);
  };

  const getWatchedEpisodes = (userId, show, season) => {
    const db = getDatabase();
    const seasonRef = ref(
      db,
      `users/${userId}/followed/${show.id}/seasons/${season}/`
    );
    onValue(seasonRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const convertedData = Object.values(data);
        const idList = [];
        convertedData.forEach((episode) => {
          idList.push(episode.id);
        });
        setWatchedEpisodes(idList);
      } else {
        setWatchedEpisodes([]);
      }
    });
  };

  useEffect(() => {
    getWatchedEpisodes(userId, show, pickedSeason);
    setEpisodesInSeason(seasons[pickedSeason - 1].length);
  }, [pickedSeason, userId, show, seasons]);

  return (
    <S.Section>
      <S.SeasonActionsRow>
        <S.ContainerDropdown>
          <S.DropdownSeason onClick={toggleSeasons}>
            <S.DropdownHeader>Season {pickedSeason}</S.DropdownHeader>
            <S.IconDown />
          </S.DropdownSeason>
          {seasonsOpen && (
            <S.DropdownList>
              {seasons.map((season, index) => (
                <S.ListItem
                  onClick={() => changeSeasonHandler(index + 1)}
                  key={index}
                >
                  Season {index + 1}
                </S.ListItem>
              ))}
            </S.DropdownList>
          )}
        </S.ContainerDropdown>
        {userId && (
          <S.MarkSeason
            onClick={() => addAllEpisodesHandler(seasons[pickedSeason - 1])}
          >
            <S.EyeIcon />
            <S.MarkTooltip>Mark season as watched</S.MarkTooltip>
          </S.MarkSeason>
        )}
      </S.SeasonActionsRow>
      {userId && <S.WatchedStats>{watchedStats}</S.WatchedStats>}
      {/*  */}
      {/* EPISODES */}
      {/*  */}
      <S.ContainerEpisodes>
        {seasons[pickedSeason - 1].map((episode) => (
          <S.Episode key={episode.id}>
            {userId !== null ? (
              <S.EpisodeImg
                onClick={() => pickEpisodeHandler(userId, show, episode)}
                clickable={true}
              >
                <S.Image src={episode.images.original || ''} />
                <S.Hoverable picked={watchedEpisodes.includes(episode.id)}>
                  <S.CheckIcon />
                </S.Hoverable>
              </S.EpisodeImg>
            ) : (
              <S.EpisodeImg>
                <S.Image src={episode.images.original || ''} />
              </S.EpisodeImg>
            )}
            <S.Row>
              <S.Number>
                s{pickedSeason}e{episode.episode}
              </S.Number>
              <S.Title>{episode.title}</S.Title>
            </S.Row>
            <S.Description>{episode.desc}...</S.Description>
            <S.Premiered>{episode.premiered}</S.Premiered>
          </S.Episode>
        ))}
      </S.ContainerEpisodes>
    </S.Section>
  );
};

export default EpisodesTab;

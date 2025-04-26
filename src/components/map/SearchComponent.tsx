import React, { useRef } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { Box, TextField } from '@mui/material';
import styled from '@emotion/styled';
import SearchIcon from '@mui/icons-material/Search';

interface SearchComponentProps {
    onLoad: (ref: google.maps.places.Autocomplete) => void;
    onPlaceChanged: () => void;
    placeName: string;
    setPlaceName: React.Dispatch<React.SetStateAction<string>>;
}

const SearchComponent = ({
    onLoad,
    onPlaceChanged,
    placeName,
    setPlaceName,
}: SearchComponentProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const handleKeyUp = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                const selectedItem = document.querySelector('.pac-item-selected');
                if (selectedItem) {
                    const name = selectedItem.querySelector('.pac-item-query')?.textContent || '';
                    setPlaceName(name);
                }
            });
        }
    };

    return (
        <SearchWrapper>
            <style>
                {`
          .pac-container {
            width: 279px !important;
            margin-top: 4px;
            border: none;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            font-family: inherit;
          }
          .pac-item {
            padding: 6px 10px;
            cursor: pointer;
          }
          .pac-item:hover {
            background-color: #f5f5f5;
          }
          .pac-item-query {
            font-size: 14px;
            color: #000000;
          }
          .pac-matched {
            color: #000000;
            font-weight: 500;
          }
          .pac-item-selected .pac-icon {
            background-image: url(https://maps.gstatic.com/mapfiles/api-3/images/autocomplete-icons.png);
            filter: brightness(0) saturate(100%) invert(67%) sepia(14%) saturate(638%) hue-rotate(178deg) brightness(87%) contrast(87%);
          }
          .pac-item > span:last-child {
            font-size: 12px;
            color: #666666;
          }
        `}
            </style>
            <Autocomplete
                onLoad={(autocomplete) => {
                    onLoad(autocomplete);
                    autocomplete.setFields?.(['place_id', 'name', 'formatted_address', 'geometry', 'photos']);
                }}
                onPlaceChanged={() => {
                    onPlaceChanged();
                    inputRef.current?.blur();
                }}
                options={{
                    componentRestrictions: { country: 'kr' },
                    // 👇 이 부분 꼭 있어야 함!
                    fields: ['place_id', 'name', 'formatted_address', 'geometry', 'photos'],
                    strictBounds: true,
                    types: ['establishment', 'geocode'],
                }}
            >
                <TextField
                    inputRef={inputRef}
                    value={placeName}
                    onChange={(e) => setPlaceName(e.target.value)}
                    onKeyUp={handleKeyUp}
                    placeholder="장소를 검색하세요."
                    variant="outlined"
                    size="small"
                    fullWidth
                    inputProps={{
                        readOnly: false,
                    }}
                    sx={{
                        backgroundColor: '#EEEEEE',
                        borderRadius: '8px',
                        fontSize: '14px',
                        '& .MuiOutlinedInput-root': {
                            fontSize: '12px',
                            color: '#000000',
                            borderRadius: '8px',
                            '& fieldset': {
                                borderColor: '#EEEEEE',
                            },
                            '&:hover fieldset': {
                                borderColor: '#EEEEEE',
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: '#EEEEEE',
                            },
                        },
                        '& input::placeholder': {
                            color: '#9A9A9A',
                            opacity: 1,
                            fontSize: '12px',
                        },
                    }}
                    InputProps={{
                        endAdornment: <SearchIcon sx={{ color: "#9A9A9A" }} />,
                    }}
                />
            </Autocomplete>
        </SearchWrapper>
    );
};

const SearchWrapper = styled(Box)`
  margin: 0 0 24px 0;
`;

export default SearchComponent;
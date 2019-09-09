import { Component } from 'react';
import css from './style.scss';
import SVG from 'react-svg';
import Link from 'next/link';
import { Icon, TypeIconName, Base, Flex, Text } from '@bitrise/bitkit';

import MagicTag from '@/components/Tag/MagicTag';

interface VersionListPageItemProps {
  platform: string;
  detailsPagePath: string;
  detailsPagePathHref: string;
  title: string;
  description: string;
  note: string;
  productFlavour?: string;
}

type VersionListPageItemState = {
  isOpen: boolean;
};

export default class VersionListPageItem extends Component<VersionListPageItemProps, VersionListPageItemState> {
  state: VersionListPageItemState = {
    isOpen: false
  };

  toggle = () => {
    const { isOpen } = this.state;
    this.setState({ isOpen: !isOpen });
  };

  render() {
    const { platform, detailsPagePath, detailsPagePathHref, title, description, note, productFlavour } = this.props;
    const { isOpen } = this.state;
    const iconName: TypeIconName = platform === 'ios' ? 'PlatformsApple' : 'PlatformsAndroid';

    const descriptionWrapperClasses = [css.descriptionWrapper];
    if (isOpen) {
      descriptionWrapperClasses.push(css.isOpen);
    }

    return (
      <div className={css.versionListPageItem}>
        <div className={css.versionListPageItemInner}>
          <Link href={detailsPagePathHref} as={detailsPagePath}>
            <a className={css.topWrapper}>
              <Base className={css.platformIconWrapper}>
                <Icon color="grape-4" name={iconName} size="1.5rem" />
              </Base>
              <Flex direction="horizontal" grow alignChildrenVertical="middle" gap="x3">
                <Text config="5" color="grape-5" className={css.title}>
                  {title}
                </Text>
                {productFlavour && <MagicTag selected>{productFlavour}</MagicTag>}
              </Flex>
              <div className={css.note}>{note}</div>
            </a>
          </Link>
          <button className={descriptionWrapperClasses.join(' ')} onClick={this.toggle}>
            <div className={css.description}>{description}</div>
            {description &&
              (isOpen ? (
                <div className={css.showLess}>
                  <div className={css.text}>Show less</div>
                  <SVG src="/static/arrow-down.svg" className={css.arrow} />
                </div>
              ) : (
                <div className={css.showMore}>
                  <div className={css.text}>Show more</div>
                  <SVG src="/static/arrow-down.svg" className={css.arrow} />
                </div>
              ))}
          </button>
        </div>
      </div>
    );
  }
}
